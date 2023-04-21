from flask import Request
from flask_http_middleware import BaseHTTPMiddleware
from webob import Response

from src.api.routes.base import RepoRequest
from src.api.routes.handle import Handle
from src.utils import log


class RespMiddleware(BaseHTTPMiddleware):
    def __init__(self):
        super().__init__()

    def dispatch(self, request: Request, call_next: callable) -> Response:
        req = RepoRequest(request=request)
        log(f"RepoRequest:{req}")
        response = Handle.handle_for_request(req)
        return response
