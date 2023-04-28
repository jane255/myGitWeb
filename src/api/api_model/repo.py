import typing as t
from enum import Enum

from pydantic import Field
from pydantic.main import BaseModel


class RepoListItem(BaseModel):
    """结构"""
    repo_id: int = Field(default=None)
    repo_name: str = Field(default=None)


class RespRepoList(BaseModel):
    """
    接口响应-仓库列表
    """
    repo_list: t.List[RepoListItem]


class RespRepoAdd(RepoListItem):
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


class RespRepoDetailFile(BaseModel):
    name: str
    path: str
    type: EnumFileType


class RespRepoDetailDir(RespRepoDetailFile):
    files: t.List


class RespRepoDetail(RepoListItem):
    """结构"""
    clone_address: str
    entries: t.List
