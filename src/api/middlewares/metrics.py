from datetime import datetime

from flask import Request
from flask import Response
from flask_http_middleware import BaseHTTPMiddleware


class MetricsMiddleware(BaseHTTPMiddleware):
    def __init__(self):
        super().__init__()

    def dispatch(self, request: Request, call_next: callable) -> Response:
        t1 = datetime.now()
        response = call_next(request)
        t2 = datetime.now()
        t = t2 - t1
        response.headers['X-Response-Time'] = str(t.total_seconds())
        return response
