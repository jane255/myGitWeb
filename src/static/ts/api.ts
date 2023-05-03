class API {
    static call(
        method: string,
        path: string,
        data: apiForm,
        callback: ResponseCallback
    ) {
        log(`api call ${method} ${path} ${JSON.stringify(data)}`)
        ajax(method, path, data, callback)
    }
}

enum Method {
    Get = 'GET',
    Post = 'POST',
}

enum Path {
    login = '/login',
    repoList = '/repo/list',
    repoAdd = '/repo/add'
}

class APIContainer {

    // static login = (data: apiForm, callback: ResponseCallback) => {
    //     API.call(Method.Post, Path.login, data, callback)
    // }

    static repoList = (username: string, callback: ResponseCallback) => {
        API.call(Method.Get, Path.repoList, {}, callback)
    }

    static repoDetail = (username: string, repoName: string, branchName: string, callback: ResponseCallback) => {
        API.call(Method.Get, `/${username}/${repoName}/src/${branchName}`, {}, callback)
    }

    // static repoAdd = (data: apiForm, callback: ResponseCallback) => {
    //     API.call(Method.Post, Path.repoAdd, data, callback)
    // }
    //
    // static repo = (username: string, repoName: string, data: apiForm, callback: ResponseCallback) => {
    //     API.call(Method.Get, `/${username}/${repoName}`, data, callback)
    // }
    //
    static repoSuffix = (path: string, data: RequestRepoSuffix, callback: ResponseCallback) => {
        API.call(Method.Post, `${path}`, data, callback)
    }

}