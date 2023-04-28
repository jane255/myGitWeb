// 定义一个事件回调类型
type EventCallback = (event: MouseEvent) => void

// 定义一个 Ajax 回调类型
type ResponseCallback = (response?: string) => void

// 定义一个接口 form 类型
interface apiForm {
    [key: string]: any
}

// /repo/list 接口返回
interface RespRepoList {
    repo_list: RespRepoListItem[]
}

interface RespRepoListItem {
    repo_id: number
    repo_name: string
}

// /repo/add 接口返回
interface RespRepoAdd extends RespRepoListItem{
    result: boolean
}

enum EnumFileType {
    file = 'file',
    dir = 'dir',
}


interface RespRepoDetailFile {
    name: string
    path: string
    type: EnumFileType
    commit_time: string
    commit_message: string
}


interface RespRepoDetailDir extends RespRepoDetailFile {
    files: []
}

// /repo/add 接口返回
interface RespRepoDetail extends RespRepoListItem{
    clone_address: string
    entries: []
}
