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
    repoList = '/repo/list',
    repoAdd = '/repo/add'
}

class APIContainer {

    static repoList = (callback: ResponseCallback) => {
        API.call(Method.Get, Path.repoList, {}, callback)
    }

    // static repoAdd = (data: apiForm, callback: ResponseCallback) => {
    //     API.call(Method.Post, Path.repoAdd, data, callback)
    // }
    //
    // static repo = (username: string, repoName: string, data: apiForm, callback: ResponseCallback) => {
    //     API.call(Method.Get, `/${username}/${repoName}`, data, callback)
    // }
    //

    static repoTarget = (path: string, callback: ResponseCallback) => {
        API.call(Method.Get, `${path}`, {}, callback)
    }

    static repoBranches = (path: string, callback: ResponseCallback) => {
        API.call(Method.Get, `${path}`, {}, callback)
    }
}