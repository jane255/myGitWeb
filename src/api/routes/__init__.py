from pydantic import BaseModel


class ResponseModel(BaseModel):
    code: int = 0
    message: str = 'success'
    data: dict = {}
    # TODO: get version from changelog
    # version = version
    env = 'local'
