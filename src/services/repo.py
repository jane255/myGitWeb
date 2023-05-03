import os
import typing as t

import pygit2
from git import Repo

import config
from api.api_model.index import ResponseRepoDetail, EnumFileType, ResponseRepoSuffix, LatestCommitItem, CommitsBranches
from models.repo import MyRepo
from models.user import User
from utils import log, timestamp_to_date


class ServiceRepo:

    @classmethod
    def add_repo(cls, repo_name: str, user_id: int) -> (bool, t.Optional[MyRepo]):
        if MyRepo.find_by(user_id=user_id, repo_name=repo_name) is not None:
            log(f"仓库:({repo_name})已存在")
            return False, None

        # 新建仓库
        repo_suffix: str = cls.create_repo(repo_name=repo_name, user_id=user_id)
        log("repo_suffix", repo_suffix)
        # 增加建库记录
        my_repo: MyRepo = cls.add_record(repo_name=repo_name, user_id=user_id)
        return True, my_repo

    @staticmethod
    def add_record(repo_name: str, user_id: int) -> MyRepo:
        d = dict(
            repo_name=repo_name,
            user_id=user_id,
        )
        my_repo = MyRepo(d)
        my_repo.save()
        return my_repo

    @classmethod
    def create_repo(cls, repo_name: str, user_id: int) -> str:
        path = cls.real_repo_path(repo_name=repo_name, user_id=user_id)
        bare_repo: Repo = Repo.init(path, bare=True)
        head = bare_repo.head.ref
        log(f"仓库:({repo_name}) 创建成功, 当前分支:{head}")
        return repo_name

    @staticmethod
    def real_repo_path(repo_name: str, user_id: int) -> str:
        repo_name += '.git'
        path: str = os.path.join(config.repos_dir + f'/{str(user_id)}/', repo_name)
        return path

    @classmethod
    def repo_detail(cls, repo_name: str, user: User, branch_name: str = 'master') -> ResponseRepoDetail:
        clone_address: str = cls.clone_address_for_name(repo_name=repo_name, user_name=user.username)
        entries: t.List[t.Dict] = cls.repo_entries(repo_name=repo_name, user_id=user.id, branch_name=branch_name)
        # log("entries", entries)
        resp = ResponseRepoDetail(
            clone_address=clone_address,
            entries=entries,
            path=f"/{user.username}/{repo_name}/src/{branch_name}",
        )
        if len(entries) > 0:
            latest_commit: LatestCommitItem = cls.latest_commit(
                repo_name=repo_name,
                user_id=user.id,
                branch_name=branch_name,
                path='',
                is_dir=True,
            )
            if latest_commit is not None:
                resp.latest_commit = latest_commit.dict()
            resp.commits_branches = cls.commits_and_branches(
                repo_name=repo_name,
                user_id=user.id,
                branch_name=branch_name,
            )
        return resp

    # 获取仓库的文件列表
    # path: 裸仓库路径
    # branch_name: 分支名称, 例如 master

    #  假设 path 对应的 git 仓库的文件结构如下
    # .
    # ├── d
    # │   └── dind
    # │       └── a.txt
    # └── out.txt
    # 该函数会输出以下内容:
    # [
    #    {
    #       "name":"d",
    #       "path":"d",
    #       "files":[
    #          {
    #             "name":"dind",
    #             "path":"d/dind",
    #             "files":[
    #                {
    #                   "name":"a.txt",
    #                   "path":"d/dind/a.txt",
    #                   "type":"file"
    #                }
    #             ],
    #             "type":"dir"
    #          }
    #       ],
    #       "type":"dir"
    #    },
    #    {
    #       "name":"out.txt",
    #       "path":"out.txt",
    #       "type":"file"
    #    }
    # ]
    @classmethod
    def repo_entries(cls, repo_name: str, user_id: int, path: str = '', branch_name: str = 'master') -> t.List[t.Dict]:
        repo_path: str = cls.real_repo_path(repo_name=repo_name, user_id=user_id)
        repo = pygit2.Repository(repo_path)
        branch = repo.branches.get(branch_name)
        # 说明是空仓库
        if branch is None:
            return []

        commit = branch.peel()
        tree = commit.tree
        # 从根目录的 tree 对象或者 path 开始解析
        # 递归地解析出所有文件/文件夹
        # 可以直接通过文件路径获取文件对应的 blob 对象
        if len(path) > 0:
            tree = tree[path]

        es = cls.tree_entries(tree, path)
        # 拿到文件或文件夹的最新提交记录
        for e in es:
            commit_record = cls.entry_latest_commit(
                repo_name=repo_name,
                user_id=user_id,
                branch_name=branch_name,
                path=e.get("path"),
                is_dir=False if e.get("type") == EnumFileType.file.value else True,
            )
            hash_code = commit_record.hex
            commit_time = timestamp_to_date(commit_record.commit_time)
            commit_message = str(commit_record.message).strip()
            e['hash_code'] = hash_code
            e['commit_time'] = commit_time
            e['commit_message'] = commit_message
        return es

    # 从 pygit2.Tree 类型中解析出文件列表
    # tree: 文件夹对应的 tree 类型对象
    # path: 文件夹路径, 输入空字符 '' 解析的是仓库根目录
    @classmethod
    def tree_entries(cls, tree: pygit2.Tree, path: str) -> t.List[t.Dict]:
        entries = []
        # Tree 类型可以直接遍历 (库作者实现了 python 的魔法方法)
        # 所以 Tree 类型也可以看做是一个元素为 pygit2.Blob (文件) 或 pygit2.Tree (子文件夹) 的列表
        for e in tree:
            # 文件/文件夹名称
            n = e.name
            if path == '':
                # 根目录
                p = n
            else:
                # 拼接完整路径
                p = '{}/{}'.format(path, n)

            o = {
                'name': n,
                'path': p,
            }
            if e.type_str == 'blob':
                # 如果是文件
                o['type'] = 'file'
            elif e.type_str == 'tree':
                # e 是子文件夹对应的 tree 对象
                # 获取子文件夹的文件
                fs = cls.tree_entries(e, p)
                o['files'] = fs
                o['type'] = 'dir'
            entries.append(o)
        entries = sorted(entries, key=lambda x: x['type'])
        return entries

    # 文件或文件夹的最新提交记录
    # repo_path: 裸仓库路径
    # branch_name: 分支名称, 例如 master
    # path: 该对象在仓库中的路径
    # is_dir: 该对象是否是文件夹, 默认不是文件夹, 也就是说, 默认是文件

    # 思路是:
    # 按时间顺序, 从最近的 commit 开始遍历, 检查每个 commit 及其上一个 commit (parent commit) 的差异
    # 如果差异中包含当前文件, 则表示在这个 commit 中修改了该文件, 那么这个 commit 就是最新的 commit
    @classmethod
    def entry_latest_commit(
            cls,
            repo_name: str,
            user_id: int,
            branch_name: str,
            path: str,
            is_dir: bool = False,
    ) -> t.Optional[pygit2.Commit]:
        repo_path: str = cls.real_repo_path(repo_name=repo_name, user_id=user_id)
        repo = pygit2.Repository(repo_path)
        branch = repo.branches.get(branch_name)
        if branch is None:
            return branch

        commit = branch.peel()

        # 按照时间顺序获取 commit 列表, commit 的顺序 git log 命令输出的一致, 最新的 commit 在最前
        # walker 可以看作类似元素为 pygit2.Commit 对象的列表
        walker = repo.walk(commit.id, pygit2.GIT_SORT_TIME)
        # walker 是 python 中的迭代器类型, 迭代器只能遍历一次, 所以这里转成真正的列表, 方便使用
        commits = list(walker)

        # 遍历分支中的所有提交
        for commit in commits:
            # parent commit (父提交) 指当前提交的上一个提交
            # 例如某个仓库的提交历史是: a--b--c
            # 那么，c 是最新的提交，b 是 c 的父提交，a 是 b 的父提交。

            # 假设使用了 git merge 命令合并过分支, 合并分支时创建的提交可能会有多个父提交
            # 因此这里要循环, 判断每一个 parent commit 和当前 commit 是否有差异
            parent_ids = commit.parent_ids
            for pid in parent_ids:
                # parent_id 是 parent commit 的 commit id
                # repo[parent_id] 可以通过该 id 找到仓库里的对象
                parent = repo[pid]
                # 返回的对象可能是 pygit2.Blob、pygit2.Tree、pygit2.Commit 和 pygit2.Tag
                # 此处预期是返回 pygit2.Commit
                assert isinstance(parent, pygit2.Commit)

                # 相当于命令 git diff parent.hex commit.hex
                diff = repo.diff(parent, commit)
                # repo.diff 返回 pygit2.Diff 对象
                assert isinstance(diff, pygit2.Diff)

                # patch 是 git diff 的基本单位, pygit2 是应该按照这个理解设计的, 因此可以将 pygit2.Diff 看作为元素是 pygit2.Patch 类型的列表
                for patch in diff:
                    assert isinstance(patch, pygit2.Patch)
                    # 获取改动的文件的路径
                    # 如果传入的文件路径和改动的路径相等, 说明当前的 commit 和它的 parent commit 相比, 这个文件发生了改动
                    f = patch.delta.new_file.path
                    if is_dir:
                        # 如果是文件夹, 则算出该文件路径对应的文件夹路径
                        # os.path.dirname 是通过文件路径, 计算出该文件所在的文件夹的路径
                        d = os.path.dirname(f)
                        if d.startswith(path + "/") or d == path:
                            return commit
                    else:
                        if f == path:
                            return commit

        # 该文件有可能只在整个分支/标签的第一个 commit 改动过, 这种情况下没有 parent commit
        first = commits[len(commits) - 1]
        return first

    @staticmethod
    def clone_address_for_name(repo_name: str, user_name: str) -> str:
        return f"http://localhost:5000/{user_name}/{repo_name}.git"

    @classmethod
    def repo_suffix(cls, repo_name: str, user: User, branch_name: str, suffix: str,
                    suffix_type: EnumFileType) -> ResponseRepoSuffix:
        if suffix_type == EnumFileType.file.value:
            content: str = cls.file_content(repo_name=repo_name, user_id=user.id, path=suffix, branch_name=branch_name)
            commits_branches: t.Dict = cls.commits_and_branches(
                repo_name=repo_name,
                user_id=user.id,
                branch_name=branch_name,
            )
            resp = ResponseRepoSuffix(
                content=content,
                commits_branches=commits_branches,
            )
            return resp
        else:
            entries: t.List[t.Dict] = cls.repo_entries(repo_name=repo_name, user_id=user.id, path=suffix,
                                                       branch_name=branch_name)
            # log("entries", entries)
            latest_commit = cls.latest_commit(
                repo_name=repo_name,
                user_id=user.id,
                branch_name=branch_name,
                path=suffix,
                is_dir=True,
            )
            commits_branches: t.Dict = cls.commits_and_branches(
                repo_name=repo_name,
                user_id=user.id,
                branch_name=branch_name,
            )
            resp = ResponseRepoSuffix(
                entries=entries,
                latest_commit=latest_commit,
                commits_branches=commits_branches,
            )
            return resp

    # 获取文件内容
    # repo_path: 裸仓库路径
    # branch_name: 分支名称, 例如 master
    # path: 该文件在仓库中的路径
    @classmethod
    def file_content(cls, repo_name: str, user_id: int, path: str, branch_name: str = 'master') -> str:
        # log("file_content", repo_name, user_id, path, branch_name)
        repo_path: str = cls.real_repo_path(repo_name=repo_name, user_id=user_id)
        # 通过裸仓库路径生成 Repository 对象
        repo = pygit2.Repository(repo_path)
        # 通过分支名生成 pygit2.Branch 对象, pygit2.Branch 对应在 git 中的概念是分支
        branch = repo.branches[branch_name]
        # 获取该分支的最新 commit
        commit = branch.peel()
        # commit.tree 对应仓库的根目录
        # 现在你相当于得到了这个分支最近一次提交时的目录
        tree = commit.tree
        # tree 可以看做是 key 为 路径, value 为 pygit2.Blob (文件) 或 pygit2.Tree (子文件夹) 的字典
        # 可以直接通过文件路径获取文件对应的 blob 对象
        entry = tree[path]
        # tree[path] 可能返回 pygit2.Blob (文件) 类型, 也可能返回 pygit2.Tree 类型, 取决于传入的路径
        assert isinstance(entry, pygit2.Blob)
        # entry.data 是文件对应的二进制
        # 假设现在只处理文本文件, 转成 utf-8 文本转回
        data = entry.data.decode('utf-8')
        return data

    @classmethod
    def latest_commit(
            cls,
            repo_name: str,
            user_id: int,
            branch_name: str,
            path: str,
            is_dir: bool = False,
    ) -> t.Optional[LatestCommitItem]:
        commit_record = cls.entry_latest_commit(
            repo_name=repo_name,
            user_id=user_id,
            branch_name=branch_name,
            path=path,
            is_dir=is_dir,
        )
        if commit_record is None:
            return None

        author = str(commit_record.author).strip().split()[0]
        hash_code = commit_record.hex
        commit_time = timestamp_to_date(commit_record.commit_time)
        commit_message = str(commit_record.message).strip()
        item = LatestCommitItem(
            author=author,
            hash_code=hash_code,
            commit_time=commit_time,
            commit_message=commit_message,
        )
        return item

    @classmethod
    def commits_and_branches(
            cls,
            repo_name: str,
            user_id: int,
            branch_name: str,
    ) -> t.Dict:
        repo_path: str = cls.real_repo_path(repo_name=repo_name, user_id=user_id)
        repo = pygit2.Repository(repo_path)
        #         - GIT_BRANCH_LOCAL - return all local branches (set by default)
        #         - GIT_BRANCH_REMOTE - return all remote-tracking branches
        #         - GIT_BRANCH_ALL - return local branches and remote-tracking branches
        # # Listing all branches
        # branches_list = list(repo.branches)
        # # Local only
        # local_branches = list(repo.branches.local)
        # # Remote only
        # remote_branches = list(repo.branches.remote)
        branch_num = len(list(repo.branches))

        branch = repo.branches.get(branch_name)
        if branch is None:
            commit_num = 0
        else:
            commit = branch.peel()
            # 按照时间顺序获取 commit 列表, commit 的顺序 git log 命令输出的一致, 最新的 commit 在最前
            # walker 可以看作类似元素为 pygit2.Commit 对象的列表
            walker = repo.walk(commit.id, pygit2.GIT_SORT_TIME)
            # walker 是 python 中的迭代器类型, 迭代器只能遍历一次, 所以这里转成真正的列表, 方便使用
            commits = list(walker)
            commit_num = len(commits)
        cb = CommitsBranches(
            branch_list=list(repo.branches),
            commit_num=commit_num,
            branch_num=branch_num,
            current_branch=branch_name,
        )
        return cb.dict()
