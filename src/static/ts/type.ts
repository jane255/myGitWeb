// 定义一个事件回调类型
type EventCallback = (event: MouseEvent) => void

// 定义一个 Ajax 回调类型
type ResponseCallback = (response?: string) => void

// 定义一个接口 form 类型
interface apiForm {
    [key: string]: any
}

// ------- 下面是函数参数 ------------
enum EnumCheckoutType {
    branch = 'branch',
    tag = 'tag',
}

// 定义一个接口，包含用户名、仓库名、分支名、commit 类型
interface RepoPath {
    username: string
    repoName: string
    target: string
    checkoutName?: string
    checkoutType?: string
    path: string
    suffix?: string
    suffixType?: string
}

// 解析二级目录
interface ParamsParseSecondaryMenu {
    repoPath: RepoPath
    repoOverview?: RepoOverview
    cloneAddress?: string
    displayFileButtons?: boolean
}

// 进入二级目录
interface ParamsEnterSecondaryDir {
    repoPath: RepoPath
    entries: []
    latest_commit: LatestCommitItem
    repo_overview: RepoOverview
}

// 进入文件
interface ParamsEnterFile {
    repoPath: RepoPath
    content: string
    repo_overview: RepoOverview
}

// ------- 下面是接口文档 ------------

interface ResponseRepoListItem {
    repo_id: number
    repo_name: string
    create_time: string
}

// /repo/list 接口返回
interface ResponseRepoList {
    repo_list: ResponseRepoListItem[]
}

// 最新提交信息
interface LatestCommitItem {
    author: string
    hash_code: string
    commit_time: string
    commit_message: string
}

// 分支数、提交数、发布数
interface RepoStats {
    commits: number
    branches: number
    releases: number
}

// 分支数、提交数、发布数
interface RepoOverview {
    branch_list: string[]
    tag_list: string[]
    current_checkout_type: string
    current_checkout_name: string
    clone_address: string
}

enum EnumFileType {
    file = 'file',
    dir = 'dir',
}

interface ResponseRepoDetailFile {
    name: string
    path: string
    type: EnumFileType
    hash_code: string
    commit_time: string
    commit_message: string
}

interface ResponseRepoDetailDir extends ResponseRepoDetailFile {
    files: []
}

// /detail 接口返回
interface ResponseRepoDetail {
    // # 统计数据
    repo_stats: RepoStats
    // # 二级菜单
    repo_overview: RepoOverview
    // # 最新 commit
    latest_commit: LatestCommitItem
    // # 文件夹
    entries:[]
}

// /repo/commits
interface ResponseRepoCommits {
    commit_list: LatestCommitItem[]
    repo_overview: RepoOverview
}

// repo/** api responser param
interface ResponserRepoSuffix {
    content: string
    entries: []
    latest_commit: LatestCommitItem
    repo_overview: RepoOverview
}

interface BranchLatestCommit extends LatestCommitItem {
    checkout_name: string
}

// /repo/branches
interface ResponseRepoBranches {
    default: BranchLatestCommit
    active_list: BranchLatestCommit[]
}

// /repo/releases
interface ResponseRepoReleases {
    release_list: BranchLatestCommit[]
}









// /repo/add 接口返回
interface ResponseRepoAdd extends ResponseRepoListItem{
    result: boolean
}

