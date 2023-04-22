class API {
    static call(method, path, data, callback) {
        log(`api call ${method} ${path} ${data}`)
        ajax(method, path, data, callback)
    }
}

class Method {
    static Get = 'GET'
    static Post = 'POST'
}
