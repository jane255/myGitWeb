from flask import Request
from flask import Response
from flask_http_middleware import BaseHTTPMiddleware

from src.api.routes import ResponseModel


class RespMiddleware(BaseHTTPMiddleware):
    def __init__(self):
        super().__init__()

    def dispatch(self, request: Request, call_next: callable) -> Response:
        response = call_next(request)
        resp_data = response.get_json()
        if resp_data:
            data = ResponseModel(data=response.json).json()
            response.set_data(data)
        return response
