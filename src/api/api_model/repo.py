import typing as t
from pydantic.main import BaseModel


class RepoListItem(BaseModel):
    """结构"""
    repo_id: str
    repo_name: str


class RespRepoList(BaseModel):
    """
    接口响应-仓库列表
    """
    repo_list: t.List[RepoListItem]

