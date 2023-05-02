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


class LatestCommitItem(BaseModel):
    author: str
    hash_code: str
    commit_time: str
    commit_message: str


# // 分支数、提交数
class CommitsBranches(BaseModel):
    commit_num: int
    branch_num: int


class ResponseRepoDetail(RepoListItem):
    """结构"""
    clone_address: str = Field(default=None)
    entries: t.List
    path: str
    latest_commit: LatestCommitItem = Field(default=None)
    commits_branches: CommitsBranches


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
    latest_commit: LatestCommitItem = Field(default=None)
