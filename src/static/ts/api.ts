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

    static login = (data: apiForm, callback: ResponseCallback) => {
        API.call(Method.Post, Path.login, data, callback)
    }

    static repoList = (username: string, data: apiForm, callback: ResponseCallback) => {
        API.call(Method.Get, Path.repoList, data, callback)
    }

    static repoAdd = (data: apiForm, callback: ResponseCallback) => {
        API.call(Method.Post, Path.repoAdd, data, callback)
    }

    static repo = (username: string, repoName: string, data: apiForm, callback: ResponseCallback) => {
        API.call(Method.Get, `/${username}/${repoName}`, data, callback)
    }

    static repoSuffix = (username: string, repoName: string, suffix: string, data: apiForm, callback: ResponseCallback) => {
        API.call(Method.Post, `/${username}/${repoName}/${suffix}`, data, callback)
    }

}