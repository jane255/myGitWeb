import os
import typing as t

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

    @staticmethod
    def create_repo(repo_name: str, user_id: int) -> str:
        repo_name += '.git'
        path: str = os.path.join(config.repos_dir + f'/{str(user_id)}/', repo_name)
        bare_repo: Repo = Repo.init(path, bare=True)
        head = bare_repo.head.ref
        log(f"仓库:({repo_name}) 创建成功, 当前分支:{head}")
        return repo_name

    @classmethod
    def repo_detail(cls, repo_id: int, user: User) -> RespRepoDetail:
        my_repo: MyRepo = MyRepo.find_by(user_id=user.id, id=repo_id)
        clone_address: str = cls.clone_address_for_name(repo_name=my_repo.repo_name, user_name=user.username)
        resp = RespRepoDetail(
            repo_id=my_repo.id,
            repo_name=my_repo.repo_name,
            clone_address=clone_address,
        )
        return resp

    @staticmethod
    def clone_address_for_name(repo_name: str, user_name: str) -> str:
        return f"git clone http://localhost:5000/repo/{user_name}/{repo_name}.git"
