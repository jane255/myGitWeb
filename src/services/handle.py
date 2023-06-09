import os
import subprocess
import typing as t
from pathlib import Path

from flask import Response, request

from api.routes import subprocessio
from utils import log


class ServiceRepoHandle:

    @classmethod
    def handle_refs(cls, user_id: int, repo_name: str, service: str) -> Response:
        # 支持 upload-pack 和 receive-pack 两种操作引用发现的处理
        cls.operation_is_forbidden(service)

        repo_path = cls.validate_repo(repo_name=repo_name, user_id=user_id)

        smart_server_advert = f'# service={service}'
        cmd = f'git {service[4:]} --stateless-rpc --advertise-refs "{repo_path}"'
        p = subprocess.Popen(
            cmd,
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        stdout, stderr = p.communicate()
        ref_data = stdout.decode("utf-8")
        log(f"cmd:{cmd}, ref_data:{ref_data}")

        ret = "{:04x}{}0000{}".format(len(smart_server_advert) + 4, smart_server_advert, ref_data)
        headers = cls.handle_refs_header(service=service)
        resp = Response(ret, headers=headers)
        return resp

    @classmethod
    def process_pack(cls, user_id: int, repo_name: str, service: str) -> Response:
        cls.operation_is_forbidden(service)
        repo_path: str = cls.validate_repo(user_id, repo_name)
        #
        cmd = f'git {service[4:]} --stateless-rpc "{repo_path}"'
        content_length = int(request.headers.get('Content-Length'), 0)
        log(f"content_length:{content_length}")
        input_data = request.stream.read(content_length)
        log(f"len:{len(input_data)}, input_data:{input_data},")

        # p = subprocess.Popen(
        #     cmd,
        #     shell=True,
        #     stdin=subprocess.PIPE,
        #     stdout=subprocess.PIPE,
        #     stderr=subprocess.PIPE,
        # )
        # stdout, stderr = p.communicate(input=input_data)
        # log(f"stdout:{stdout.decode('utf-8')},")
        # log(f"stderr:{stderr.decode('utf-8')},")
        #
        # ref_data = stdout.decode("utf-8")

        try:
            ref_data = subprocessio.SubprocessIOChunker(
                cmd,
                inputstream=input_data,
            )
        except EnvironmentError as e:
            log(e)
            return Response(status=500)
        log(f"cmd:{cmd}, ref_data:{ref_data}")

        headers = cls.handle_pack_header(service)
        resp = Response(ref_data, headers=headers)
        return resp

    @staticmethod
    def validate_repo(user_id: int, repo_name: str) -> t.Union[Response, str]:
        project_dir = Path(__file__).parent.parent.parent
        repos_dir = f'{project_dir}/repos/{str(user_id)}'
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
    def handle_refs_header(service: str) -> dict:
        headers = {
            "Content-Type": f'application/x-{service}-advertisement',
            "Expires": "Fri, 01 Jan 1980 00:00:00 GMT",
            "Pragma": "no-cache",
            "Cache-Control": "no-cache, max-age=0, must-revalidate"
        }
        return headers

    @staticmethod
    def handle_pack_header(service: str) -> dict:
        headers = {
            "Content-Type": f'application/x-{service}-advertisement',
            "Connection": "Keep-Alive",
            "Transfer-Encoding": "chunked",
            "X-Content-Type-Options": "nosniff",
        }
        return headers
