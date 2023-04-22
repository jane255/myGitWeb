import typing as t
from flask import Request
from flask import Response as flask_Response
from flask_http_middleware import BaseHTTPMiddleware
from webob import Response

from src.api.routes import ResponseModel
from src.api.routes.base import RepoRequest
from src.api.routes.handle import Handle
from src.utils import log


class RespMiddleware(BaseHTTPMiddleware):
    def __init__(self):
        super().__init__()

    def dispatch(self, request: Request, call_next: callable) -> t.Union[flask_Response, Response]:
        if request.path.startswith("/repos"):
            req = RepoRequest(request=request)
            log(f"RepoRequest:{req}")
            response = Handle.handle_for_request(req)
            return response
        else:
            response = call_next(request)
            resp_data = response.get_json()
            if resp_data:
                data = ResponseModel(data=response.json).json()
                response.set_data(data)
            return response
