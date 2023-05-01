import typing as t
from enum import Enum

from pydantic import Field
from pydantic.main import BaseModel


class RequestLogin(BaseModel):
    username: str
    password: str


class ResponseLogin(BaseModel):
    result: bool
    user_id: int
    username: str


class RepoListItem(BaseModel):
    """结构"""
    repo_id: int = Field(default=None)
    repo_name: str = Field(default=None)
    create_time: str = Field(default=None)


class ResponseRepoDetail(RepoListItem):
    """结构"""
    username: str
    clone_address: str = Field(default=None)
    entries: t.List


class ResponseRepoList(BaseModel):
    """
    接口响应-仓库列表
    """
    repo_list: t.List[RepoListItem]


class ResponseRepoAdd(RepoListItem):
    """结构"""
    result: bool


class EnumFileType(Enum):
    """
    文件类型:
    0: Trial, '试用'
    1: Perpetual '永久'
    """
    file = 'file'
    dir = 'dir'


class ResponseRepoDetailFile(BaseModel):
    name: str
    path: str
    type: EnumFileType


class ResponseRepoDetailDir(ResponseRepoDetailFile):
    files: t.List


# /repo/suffix
class ResponseRepoSuffix(BaseModel):
    """结构"""
    content: str = Field(default=None)
    entries: t.List = Field(default=None)
    path: str = Field(default=None)
