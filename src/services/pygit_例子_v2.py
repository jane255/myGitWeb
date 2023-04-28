# 安装依赖: pip install pygit2
# 官方文档: https://www.pygit2.org/
# 补充的参考文档: https://davidfischer.name/2013/06/getting-started-with-pygit2/

# 本文件包括三个例子:
# 1. 获取文件的内容 (file_content 函数)
# 2. 获取仓库所有的文件、文件夹列表 (repo_entries 函数)
# 3. 获取文件对应的最新提交 (entry_latest_commit 函数)
# main 函数中是简单的测试

# 前置知识:
# git 中有 4 个主要对象
# blob: 表示文件, 存储了文件内容. 对应 pygit2 的 Blob 类型
# tree: 表示文件夹, 存储了文件 (blob) 和子文件夹 (另一个 tree 对象), 每一个文件夹都会对应一个 tree 对象. 对应 pygit2 的 Tree 类型
# commit: 表示提交, commit 会有一个 tree 对象指向项目的根目录. 对应 pygit2 的 Commit 类型
# tag: 表示标签, git 标签实际上是某个特定的 commit. 对应 pygit2 的 Tag 类型

import os
import typing as t

import pygit2


# 获取文件内容
# repo_path: 裸仓库路径
# branch_name: 分支名称, 例如 master
# path: 该文件在仓库中的路径
def file_content(repo_path: str, branch_name: str, path: str) -> str:
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
def repo_entries(path: str, branch_name: str) -> t.List[t.Dict]:
    repo = pygit2.Repository(path)
    branch = repo.branches[branch_name]
    commit = branch.peel()
    tree = commit.tree
    # 从根目录的 tree 对象开始解析
    # 递归地解析出所有文件/文件夹
    es = tree_entries(tree, '')
    return es


# 从 pygit2.Tree 类型中解析出文件列表
# tree: 文件夹对应的 tree 类型对象
# path: 文件夹路径, 输入空字符 '' 解析的是仓库根目录
def tree_entries(tree: pygit2.Tree, path: str) -> t.List[t.Dict]:
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
            fs = tree_entries(e, p)
            o['files'] = fs
            o['type'] = 'dir'
        entries.append(o)
    return entries


# 文件或文件夹的最新提交记录
# repo_path: 裸仓库路径
# branch_name: 分支名称, 例如 master
# path: 该对象在仓库中的路径
# is_dir: 该对象是否是文件夹, 默认不是文件夹, 也就是说, 默认是文件

# 思路是:
# 按时间顺序, 从最近的 commit 开始遍历, 检查每个 commit 及其上一个 commit (parent commit) 的差异
# 如果差异中包含当前文件, 则表示在这个 commit 中修改了该文件, 那么这个 commit 就是最新的 commit
def entry_latest_commit(
    repo_path: str, 
    branch_name: str, 
    path: str, 
    is_dir: bool = False,
) -> pygit2.Commit:
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
    first = commits[len(commits)-1]
    return first


def main():
    # 如果为了方便测试, 可以创建一个普通仓库 test_repo, 在 test_repo 中直接进行提交、创建分支等操作
    # 而后通过以下命令, 将这个普通仓库转换为裸仓库
    # git clone test_repo test_repo.git --bare

    # 参数改成自己想要的
    repo_path = '/Users/jane/Desktop/repo/myGitWeb/repos/1/axe.git'
    branch_name = 'master'
    file_path = 'd/dind/a.txt'

    # content = file_content(repo_path, branch_name, file_path)
    # print('file_content ({})'.format(content))

    entries = repo_entries(repo_path, branch_name)
    print('repo_entries ({})'.format(entries))

    # commit = entry_latest_commit(repo_path, branch_name, file_path)
    # print('entry_latest_commit ({})'.format(commit))


if __name__ == '__main__':
    main()
