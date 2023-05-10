import typing as t
from enum import Enum

from pydantic import Field
from pydantic.main import BaseModel


class RepoListItem(BaseModel):
    """结构"""
    repo_id: int = Field(default=None)
    repo_name: str = Field(default=None)
    create_time: str = Field(default=None)


class ResponseRepoList(BaseModel):
    """
    接口响应-仓库列表
    """
    repo_list: t.List[RepoListItem]


class ResponseRepoAdd(RepoListItem):
    """结构"""
    result: bool


class LatestCommitItem(BaseModel):
    author: str
    hash_code: str
    commit_time: str
    commit_message: str


# // 分支数、提交数、发布数
class RepoStats(BaseModel):
    commits: int
    branches: int
    releases: int


class RepoOverview(BaseModel):
    branch_list: t.List[str]
    tag_list: t.List[str]
    current_checkout_type: str
    current_checkout_name: str
    clone_address: str


# 仓库详情
class ResponseRepoDetail(RepoListItem):
    """结构"""

    # 统计数据
    repo_stats: RepoStats = Field(default=None)
    # 二级菜单
    repo_overview: RepoOverview = Field(default=None)
    # 最新 commit
    latest_commit: LatestCommitItem = Field(default=None)
    # 文件夹
    entries: t.List


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
    # 文件
    content: str = Field(default=None)
    # 文件夹
    entries: t.List = Field(default=None)
    latest_commit: LatestCommitItem = Field(default=None)
    # 公共
    repo_overview: RepoOverview = Field(default=None)


# /repo/commits
class ResponseRepoCommits(BaseModel):
    """结构"""
    commit_list: t.List[LatestCommitItem]
    repo_overview: RepoOverview = Field(default=None)


class BranchLatestCommit(LatestCommitItem):
    checkout_name: str


# /repo/branches
class ResponseRepoBranches(BaseModel):
    """结构"""
    default: BranchLatestCommit
    active_list: t.List[BranchLatestCommit]


# /repo/releases
class ResponseRepoReleases(BaseModel):
    """结构"""
    release_list: t.List[BranchLatestCommit]
