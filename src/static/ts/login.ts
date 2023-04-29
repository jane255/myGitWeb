class LoginContainer {

    static validateParam = (username: string, password: string) => {
        if (username == null || username.length < 1) {
            alert("用户名必须填写")
        } else if (password == null || password.length < 1) {
            alert("密码必须填写")
        }
    }

    static bindEvent = () => {
        let self = this
        let username: string = e(".input-username").value
        let password: string = e(".input-password").value
        log("点击了登录", `username:(${username})`, `password:(${password})`)
        // 验证参数
        self.validateParam(username, password)
        //
        self.login(username, password)
    }

    static login = (username: string, password: string) => {
        let form: RequestLogin = {
            username: username,
            password: password
        }
        //
        APIContainer.login(form, function (r) {
            let response = JSON.parse(r)
            let responseLogin: ResponseLogin = response.data
            if (! responseLogin.result) {
                alert("用户名有误或者用户名有重复，请重新输入")
            } else {
            }
        })
    }
}

class ActionLogin extends Action {
    static eventActions = {
        'click': {
            'click': LoginContainer.bindEvent,
        },
    }
}

const __mainLogin = function () {
    ActionLogin.bindEvent()
}

__mainLogin()

