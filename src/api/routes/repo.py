import json
import os

from flask import Blueprint, render_template, request
from git import Repo

from src import config
from src.utils import log

main = Blueprint('repo', __name__)


@main.route('/')
def index():
    # 返回一个 templates 文件夹下的 html 页面
    return render_template(
        "index.html",
    )


@main.route('/add', methods=['POST'])
def add():
    form = json.loads(request.get_data(as_text=True))
    log("add form", form)
    repo_name = form.get("repo_name")
    repo_suffix = make_repo(repo_name)
    return dict(
        repo_name=repo_name,
        clone_address=f"git clone http://localhost:5000/repos/{repo_suffix}",
    )


def make_repo(repo_name: str) -> str:
    repo_name += '.git'
    path = os.path.join(config.repos_dir + '/', repo_name)
    if os.path.exists(path):
        log(f"仓库:({repo_name})已存在")
    else:
        bare_repo = Repo.init(path, bare=True)
        head = bare_repo.head.ref
        log(f"仓库:({repo_name}) 创建成功, 当前分支:{head}")
    return repo_name
