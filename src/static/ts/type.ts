// 定义一个事件回调类型
type EventCallback = (event: MouseEvent) => void

// 定义一个 Ajax 回调类型
type ResponseCallback = (response?: string) => void

// 定义一个接口 form 类型
interface apiForm {
    [key: string]: any
}

// /repo/list 接口返回
interface ResponseRepoList {
    repo_list: ResponseRepoListItem[]
}

interface ResponseRepoListItem {
    repo_id: number
    repo_name: string
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

// /repo/add 接口返回
interface ResponseRepoDetail extends ResponseRepoListItem{
    clone_address: string
    entries: []
}

// login api request param
interface RequestLogin {
    username: string
    password: string
}

interface ResponseLogin {
    result: boolean
}
