import json
import typing as t
import functools

from flask import session, render_template, request
from pydantic import BaseModel

from src.models.user import User


class ResponseModel(BaseModel):
    code: int = 0
    message: str = 'success'
    data: dict = {}
    # TODO: get version from changelog
    # version = version
    env = 'local'


def current_user():
    # 从 session 中找到 user_id 字段, 找不到就 -1
    # 然后 User.find_by 来用 id 找用户
    # 找不到就返回 None
    uid = session.get('user_id', -1)
    u = User.find_by(id=uid)
    return u


def login_required(f):
    @functools.wraps(f)
    def wrapped(*args, **kwargs):
        if current_user() is None:
            return render_template("login.html")
        else:
            return f(*args, **kwargs)

    return wrapped


def get_request_json() -> t.Dict:
    return json.loads(request.get_data(as_text=True))
