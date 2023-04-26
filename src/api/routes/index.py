from flask import (
    Blueprint,
    redirect,
    url_for, request, session,
)

from api.routes import login_required
from models.user import User
from utils import all_avatar, log

main = Blueprint('', __name__)


@main.route('/')
@login_required
def index():
    return redirect(url_for('repo.index'))


@main.route('/avatar/list')
def get_avatar_list():
    avatar_list = all_avatar()
    return dict(
        avatar_list=avatar_list
    )


def register():
    form = request.form
    log("register form", form)
    u = User.register(form)


@main.route("/login", methods=['POST'])
def login():
    form = request.form
    log("login form", form)
    u = User.validate_login(form)
    if u is None:
        register()
    # session 中写入 user_id
    session['user_id'] = u.id
    session.permanent = True
    #
    return redirect(url_for('repo.index'))
