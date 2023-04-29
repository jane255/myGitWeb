import json
import typing as t

from flask import Blueprint, request

from api.api_model.index import ResponseRepoAdd, RepoListItem
from api.routes import login_required, current_user
from models.repo import MyRepo
from models.user import User
from services.repo import ServiceRepo
from src.utils import log

main = Blueprint('repo', __name__)


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
    response = ResponseRepoAdd(
        result=result,
    )
    if result:
        response.repo_id = repo_info.id
        response.repo_name = repo_info.repo_name
    return response.dict()


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
