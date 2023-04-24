class API {
    static call(method: string, path: string, data: object, callback: (r) => void) {
        log(`api call ${method} ${path} ${data}`)
        ajax(method, path, data, callback)
    }
}

class Method {
    static Get = 'GET'
    static Post = 'POST'
}
