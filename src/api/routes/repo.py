import json
import typing as t

from flask import Blueprint, request, redirect, url_for

from api.api_model.index import ResponseRepoAdd, RepoListItem
from api.routes import login_required, current_user
from models.repo import MyRepo
from models.user import User
from services.repo import ServiceRepo
from src.utils import log, timestamp_to_date

main = Blueprint('repo', __name__)


@main.route('/add', methods=['POST'])
@login_required
def add():
    form: dict = request.form
    log("add form", form)
    repo_name: str = form.get("repo_name")
    description: str = form.get('description', '')
    user: User = current_user()

    add_result = ServiceRepo.add_repo(user_id=user.id, repo_name=repo_name, description=description)
    result: bool = add_result[0]
    repo_info: MyRepo = add_result[1]
    #
    response = ResponseRepoAdd(
        result=result,
    )
    if result:
        response.repo_id = repo_info.id
        response.repo_name = repo_info.repo_name
    return redirect(url_for('myself', username=user.username))


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
            create_time=timestamp_to_date(repo.create_time),
        )
        result.append(item.dict())
    return dict(
        repo_list=result,
    )
