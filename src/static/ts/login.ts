class LoginContainer {

    static validateParam = () => {
        let username = e(".input-username").value
        let password = e(".input-password").value
        log("点击了登录", `username:(${username})`, `password:(${password})`)
        if (username == null || username.length < 1) {
            alert("用户名必须填写")
        } else if (password == null || password.length < 1) {
            alert("密码必须填写")
        }
    }
}

