import typing as t
import json
import os

from flask import Blueprint, render_template, request
from git import Repo

from api.api_model.repo import RepoListItem
from api.routes import login_required, current_user
from models.repo import MyRepo
from src import config
from src.utils import log

main = Blueprint('repo', __name__)


@main.route('/', methods=['GET'])
@login_required
def index():
    # 返回一个 templates 文件夹下的 html 页面
    return render_template(
        "index.html",
    )


@main.route('/list', methods=['GET'])
@login_required
def get_list():
    user = current_user()
    repo_list: t.List[MyRepo] = MyRepo.find_all(user_id=user.id)
    result = []
    for repo in repo_list:
        item = RepoListItem(
            repo_id=repo.id,
            repo_name=repo.repo_name,
        )
        result.append(item.dict())
    return dict(
        repo_list=result,
    )


@main.route('/add', methods=['POST'])
@login_required
def add():
    form: dict = json.loads(request.get_data(as_text=True))
    log("add form", form)
    repo_name: str = form.get("repo_name")
    user = current_user()
    if MyRepo.find_by(user_id=user.id, repo_name=repo_name) is not None:
        return dict(
            result=False
        )

    repo_suffix, result = make_repo(repo_name, user.id)
    log("repo_suffix, result", repo_suffix, result)
    # 增加建库记录
    d = dict(
        repo_name=repo_name,
        user_id=user.id,
    )
    my_repo = MyRepo(d)
    my_repo.save()
    return dict(
        repo_id=my_repo.id,
        repo_name=repo_name,
        # clone_address=f"git clone http://localhost:5000/repos/{repo_suffix}",
        result=result,
    )


def make_repo(repo_name: str, user_id: int) -> (str, bool):
    repo_name += '.git'
    path = os.path.join(config.repos_dir + f'/{str(user_id)}/', repo_name)
    if os.path.exists(path):
        log(f"仓库:({repo_name})已存在")
        result = False
    else:
        bare_repo = Repo.init(path, bare=True)
        head = bare_repo.head.ref
        log(f"仓库:({repo_name}) 创建成功, 当前分支:{head}")
        result = True
    return repo_name, result
