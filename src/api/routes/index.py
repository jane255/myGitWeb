from flask import (
    Blueprint,
    redirect,
    url_for,
)

main = Blueprint('', __name__)


@main.route('/')
def index():
    return redirect(url_for('repo.index'))
