import typing as t

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


class RespRepoDetail(RepoListItem):
    """结构"""
    clone_address: str
