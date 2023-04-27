import json
import typing as t

from flask import Blueprint, render_template, request
from flask_httpauth import HTTPBasicAuth

from api.api_model.repo import RepoListItem, RespRepoAdd, RespRepoDetail
from api.routes import login_required, current_user
from models.repo import MyRepo
from models.user import User
from services.handle import ServiceRepoHandle
from services.repo import ServiceRepo
from src.utils import log

main = Blueprint('repo', __name__)

auth = HTTPBasicAuth()


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
    user: User = current_user()
    repo_list: t.List[MyRepo] = MyRepo.find_all(user_id=user.id)
    result: t.List[t.Dict] = []
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
    user: User = current_user()

    add_result = ServiceRepo.add_repo(user_id=user.id, repo_name=repo_name)
    result: bool = add_result[0]
    repo_info: MyRepo = add_result[1]
    #
    response = RespRepoAdd(
        result=result,
    )
    if result:
        response.repo_id = repo_info.id
        response.repo_name = repo_info.repo_name
    return response.dict()


@main.route('/detail', methods=['POST'])
@login_required
def detail():
    form: dict = json.loads(request.get_data(as_text=True))
    log("add form", form)
    repo_id: int = form.get("repo_id")
    user: User = current_user()

    repo_detail: RespRepoDetail = ServiceRepo.repo_detail(repo_id=repo_id, user=user)
    return repo_detail.dict()


@auth.verify_password
def verify_password(username, password):
    log("verify_password", username, password)
    user: User = User.find_by(username=username)
    if user is not None and user.password == user.salted_password(password):
        return username


@main.route('/<username>/<repo_name>/info/refs', methods=['GET'])
@auth.login_required
def repos_handle_refs(username: str, repo_name: str):
    service = request.args.get("service")
    log(f"repos_handle_refs -- username:{username}, repo_name:{repo_name}, service:{service}")
    user = User.find_by(username=username)
    response = ServiceRepoHandle.handle_refs(user_id=user.id, repo_name=repo_name, service=service)
    return response


@main.route('/<username>/<repo_name>/<service>', methods=['POST'])
def repos_process_pack(username: str, repo_name: str, service: str):
    log(f"repos_process_pack -- repo_name:{repo_name}, service:{service}")
    user = User.find_by(username=username)

    response = ServiceRepoHandle.process_pack(user_id=user.id, repo_name=repo_name, service=service)
    return response
