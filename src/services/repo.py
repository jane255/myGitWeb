import os
import typing as t

import pygit2
from git import Repo

import config
from api.api_model.repo import RespRepoDetail
from models.repo import MyRepo
from models.user import User
from utils import log


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
        path: str = cls.real_repo_path(repo_name=repo_name, user_id=user_id)
        repo = pygit2.Repository(path)
        branch = repo.branches.get(branch_name)
        # 说明是空仓库
        if branch is None and branch_name == 'master':
            return []

        commit = branch.peel()
        tree = commit.tree
        # 从根目录的 tree 对象开始解析
        # 递归地解析出所有文件/文件夹
        es = cls.tree_entries(tree, '')
        return es

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
