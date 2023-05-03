from flask import (
    Blueprint,
    redirect,
    url_for, request, session, render_template,
)
from flask_httpauth import HTTPBasicAuth

from api.api_model.index import ResponseRepoDetail, ResponseRepoSuffix
from api.routes import login_required, current_user, get_request_json
from models.user import User
from services.handle import ServiceRepoHandle
from services.repo import ServiceRepo
from utils import all_avatar, log

main = Blueprint('', __name__)

auth = HTTPBasicAuth()


@main.route('/', methods=['GET'])
@login_required
def index():
    u = current_user()
    return redirect(url_for('.myself', username=u.username))


@main.route('/avatar/list', methods=['GET'])
def get_avatar_list():
    avatar_list = all_avatar()
    return dict(
        avatar_list=avatar_list
    )


@main.route("/login", methods=['POST'])
def login():
    form = get_request_json()
    log("login form", form)
    u = User.validate_login(form)
    if u is None:
        u = User.register(form=form)
        if u is None:
            return dict(
                result=False,
            )
    # session 中写入 user_id
    session['user_id'] = u.id
    session.permanent = True
    return redirect(url_for('.myself', username=u.username))


@main.route("/logout", methods=['GET'])
@login_required
def logout():
    session.pop('user_id')
    #
    return redirect(url_for('.index'))


@main.route('/<username>', methods=['GET'])
@login_required
def myself(username: str):
    # 返回一个 templates 文件夹下的 html 页面
    return render_template(
        "index.html",
    )


@auth.verify_password
def verify_password(username, password):
    log("verify_password", username, password)
    user: User = User.find_by(username=username)
    if user is not None and user.password == user.salted_password(password):
        return username


# git clone fetch 的请求函数
@main.route('/<username>/<repo_name>/info/refs', methods=['GET'])
@auth.login_required
def repos_handle_refs(username: str, repo_name: str):
    service = request.args.get("service")
    log(f"repos_handle_refs -- username:{username}, repo_name:{repo_name}, service:{service}")
    user = User.find_by(username=username)
    response = ServiceRepoHandle.handle_refs(user_id=user.id, repo_name=repo_name, service=service)
    return response


# git pull 的请求函数
@main.route('/<username>/<repo_name>/git-upload-pack', methods=['POST'])
@auth.login_required
def repos_process_pack_upload(username: str, repo_name: str):
    service = 'git-upload-pack'
    log(f"repos_process_pack -- repo_name:{repo_name}, service:{service}")
    user = User.find_by(username=username)

    response = ServiceRepoHandle.process_pack(user_id=user.id, repo_name=repo_name, service=service)
    return response


# git push
@main.route('/<username>/<repo_name>/git-receive-pack', methods=['POST'])
@auth.login_required
def repos_process_pack_receive(username: str, repo_name: str):
    service = 'git-receive-pack'
    log(f"repos_process_pack -- repo_name:{repo_name}, service:{service}")
    user = User.find_by(username=username)

    response = ServiceRepoHandle.process_pack(user_id=user.id, repo_name=repo_name, service=service)
    return response


# 仓库
@main.route('/<username>/<repo_name>', methods=['GET'])
@login_required
def repo(username: str, repo_name: str):
    return render_template('repo.html')


# 仓库
@main.route('/<username>/<repo_name>/src/<branch_name>', methods=['GET'])
@login_required
def repo_detail(username: str, repo_name: str, branch_name: str):
    user = current_user()
    response: ResponseRepoDetail = ServiceRepo.repo_detail(repo_name=repo_name, user=user, branch_name=branch_name)
    return response.dict()


@main.route('/<username>/<repo_name>/src/<branch_name>/<path:suffix>', methods=['POST'])
@login_required
def repo_suffix(username: str, repo_name: str, branch_name: str, suffix):
    form = get_request_json()
    suffix_type = form.get('type')
    user = current_user()
    response: ResponseRepoSuffix = ServiceRepo.repo_suffix(
        repo_name=repo_name, user=user, branch_name=branch_name, suffix=suffix, suffix_type=suffix_type)
    response.path = request.path
    return response.dict()
