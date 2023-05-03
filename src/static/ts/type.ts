// 定义一个事件回调类型
type EventCallback = (event: MouseEvent) => void

// 定义一个 Ajax 回调类型
type ResponseCallback = (response?: string) => void

// 定义一个接口 form 类型
interface apiForm {
    [key: string]: any
}

// ------- 下面是函数参数 ------------
// 解析二级目录
interface ParamsParseSecondaryMenu {
    path: string
    commits_branches?: CommitsBranches
    clone_address?: string
    displayFileButtons?: boolean
}

// 进入二级目录
interface ParamsEnterSecondaryDir {
    entries: []
    path: string
    latest_commit: LatestCommitItem
    commits_branches: CommitsBranches
}

// 进入文件
interface ParamsEnterFile {
    path: string
    content: string
    commits_branches: CommitsBranches
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

// 分支数、提交数
interface CommitsBranches {
    commit_num: number
    branch_num: number
    branch_list: string[]
    current_branch: string
}

// /detail 接口返回
interface ResponseRepoDetail {
    clone_address: string
    entries: []
    path: string
    latest_commit: LatestCommitItem
    commits_branches: CommitsBranches
}

// /repo/add 接口返回
interface ResponseRepoAdd extends ResponseRepoListItem{
    result: boolean
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

// login api request param
interface RequestLogin {
    username: string
    password: string
}

interface ResponseLogin {
    result: boolean
}

// repo/** api request param
interface RequestRepoSuffix {
    type: string
}

// repo/** api responser param
interface ResponserRepoSuffix {
    content: string
    entries: []
    path: string
    latest_commit: LatestCommitItem
    commits_branches: CommitsBranches
}
