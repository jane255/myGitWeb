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
