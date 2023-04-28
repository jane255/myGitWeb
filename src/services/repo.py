import os
import typing as t

import pygit2
from git import Repo

import config
from api.api_model.repo import RespRepoDetail, EnumFileType
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
    def repo_detail(cls, repo_id: int, user: User) -> RespRepoDetail:
        my_repo: MyRepo = MyRepo.find_by(user_id=user.id, id=repo_id)
        repo_name = my_repo.repo_name
        clone_address: str = cls.clone_address_for_name(repo_name=repo_name, user_name=user.username)
        entries: t.List[t.Dict] = cls.repo_entries(repo_name=repo_name, user_id=user.id)
        log("entries", entries)
        resp = RespRepoDetail(
            repo_id=my_repo.id,
            repo_name=my_repo.repo_name,
            clone_address=clone_address,
            entries=entries,
        )
        return resp

    @classmethod
    def repo_entries(cls, repo_name: str, user_id: int, branch_name: str = 'master') -> t.List[t.Dict]:
        repo_path: str = cls.real_repo_path(repo_name=repo_name, user_id=user_id)
        repo = pygit2.Repository(repo_path)
        branch = repo.branches.get(branch_name)
        # 说明是空仓库
        if branch is None and branch_name == 'master':
            return []

        commit = branch.peel()
        tree = commit.tree
        # 从根目录的 tree 对象开始解析
        # 递归地解析出所有文件/文件夹
        es = cls.tree_entries(tree, '')
        # 拿到文件或文件夹的最新提交记录
        for e in es:
            commit_record = cls.entry_latest_commit(
                repo_name=repo_name,
                user_id=user_id,
                branch_name=branch_name,
                path=e.get("path"),
                is_dir=False if e.get("type") == EnumFileType.file else True,
            )
            commit_time = timestamp_to_date(commit_record.commit_time)
            commit_message = str(commit_record.message).strip()
            e['commit_time'] = commit_time
            e['commit_message'] = commit_message
        return es

    @classmethod
    def entry_latest_commit(
            cls,
            repo_name: str,
            user_id: int,
            branch_name: str,
            path: str,
            is_dir: bool = False,
    ) -> pygit2.Commit:
        repo_path: str = cls.real_repo_path(repo_name=repo_name, user_id=user_id)
        repo = pygit2.Repository(repo_path)
        branch = repo.branches[branch_name]
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
                        if d == path:
                            return commit
                    else:
                        if f == path:
                            return commit

        # 该文件有可能只在整个分支/标签的第一个 commit 改动过, 这种情况下没有 parent commit
        first = commits[len(commits) - 1]
        return first

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

    @staticmethod
    def clone_address_for_name(repo_name: str, user_name: str) -> str:
        return f"git clone http://localhost:5000/repo/{user_name}/{repo_name}.git"
