from flask import Flask
from flask_http_middleware import MiddlewareManager

from src import config
from src.api.middlewares.metrics import MetricsMiddleware
from src.api.middlewares.resp import RespMiddleware


def register_routes(a):
    # 注册路由函数
    from api.routes.index import main as index_blueprint
    from api.routes.repo import main as repo_blueprint
    from api.routes.repos import main as repos_blueprint

    a.register_blueprint(index_blueprint, url_prefix='/')
    a.register_blueprint(repo_blueprint, url_prefix='/repo')
    a.register_blueprint(repos_blueprint, url_prefix='/repos')


def register_middleware(a):
    a.wsgi_app = MiddlewareManager(a)
    # 先注册的中间件最后执行
    a.wsgi_app.add_middleware(RespMiddleware)
    # 统计请求耗时中间件需要放在最后
    a.wsgi_app.add_middleware(MetricsMiddleware)


def configured_app():
    a = Flask(__name__, template_folder=config.templates_dir, static_folder=config.static_dir)
    a.config['SECRET_KEY'] = 'secret_key'

    register_routes(a)
    register_middleware(a)
    return a


app = configured_app()
# 这个文件都是套路写法
