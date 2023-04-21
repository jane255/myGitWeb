import typing as t
import os
from webob import Response

from src.api.routes import subprocessio
from src.api.routes.base import RepoRequest
from src.utils import log

from pathlib import Path


class Handle:
    
    @classmethod
    def handle_for_request(cls, request: RepoRequest) -> Response:
        path = request.path
        if '/info/refs' in path:
            return cls.handle_refs(request=request)

        if 'git-upload-pack' in path or "git-receive-pack" in path:
            return cls.process_pack(request=request)

        return Response(status=500)

    @staticmethod
    def validate_repo(repo_name: str) -> t.Union[Response, str]:
        project_dir = Path(__file__).parent.parent.parent.parent
        repos_dir = f'{project_dir}/repos'
        repo_path = os.path.realpath(os.path.join(repos_dir, repo_name))
        if not os.path.isdir(repo_path):
            return Response(status=404)
        return repo_path

    @staticmethod
    def operation_is_forbidden(service: str) -> t.Optional[Response]:
        if service not in ['git-upload-pack', 'git-receive-pack']:
            log(f"Operation not permitted: {service}")
            return Response(status=403)

    @staticmethod
    def handle_refs_header(service: str) -> Response:
        resp = Response()
        resp.content_type = f'application/x-{service}-advertisement'
        resp.cache_control = "no-cache, max-age=0, must-revalidate"
        resp.pragma = "no-cache"
        return resp

    @staticmethod
    def handle_pack_header(service: str) -> Response:
        resp = Response()
        resp.content_type = f'application/x-{service}-advertisement'
        # 	(*w).Header().Set("Connection", "Keep-Alive")
        # 	(*w).Header().Set("Transfer-Encoding", "chunked")
        # 	(*w).Header().Set("X-Content-Type-Options", "nosniff")
        return resp

    @classmethod
    def handle_refs(cls, request: RepoRequest) -> Response:
        service = request.service
        cls.operation_is_forbidden(service)

        repo_path = cls.validate_repo(request.repo_name)

        smart_server_advert = f'# service={service}\n'
        try:
            out = subprocessio.SubprocessIOChunker(
                f'git {service[4:]} --stateless-rpc --advertise-refs "{repo_path}"',
                starting_values=[
                    str(hex(len(smart_server_advert) + 4)[2:].rjust(4, '0') + smart_server_advert + '0000')]
            )
        except EnvironmentError as e:
            log(e)
            return Response(status=500)

        resp = cls.handle_refs_header(service)
        resp.app_iter = out
        return resp

    @classmethod
    def process_pack(cls, request: RepoRequest) -> Response:
        self = request
        service = self.service
        cls.operation_is_forbidden(service)

        repo_path = cls.validate_repo(self.repo_name)
        content_length = int(self.request.headers['Content-Length'])
        input_data = self.request.stream.read(content_length)
        try:
            out = subprocessio.SubprocessIOChunker(
                f'git {service[4:]} --stateless-rpc "{repo_path}"',
                inputstream=input_data,
            )
        except EnvironmentError as e:
            log(e)
            return Response(status=500)
        resp = cls.handle_pack_header(service)
        resp.app_iter = out
        return resp

