const validateLoginForm = () => {
    let username: string = e(".input-username").value
    let password: string = e(".input-password").value
    let avatar: string = e(".input-avatar").value
    log("点击了登录", `username:(${username})`, `password:(${password})`, `avatar:(${avatar})`)
    if ( username == null || username.length < 1) {
        alert("username 必须填写")
        return false
    } else if ( password == null || password.length < 1) {
        alert("password 必须填写")
        return false
    } else if ( avatar == null || avatar.length < 1) {
        alert("必须挑选头像")
        return false
    }
}

class Avatar extends GuaObject {
    static avatar: string = 'class-avatar-list'
    static avatarSel: HTMLSelectElement = e(`.${this.avatar}`)

    static initAvatar() {
        let self = this
        API.call(Method.Get, '/avatar/list', {}, function(r){
            let response = JSON.parse(r)
            let avatar_list = response.data.avatar_list
            let avatarSel = self.avatarSel
            for (let a of avatar_list) {
                let t = `
                    <img class="class-avatar" data-value=${a} src="/static/img/avatar/${a}">
                `
                appendHtml(avatarSel, t)
            }
        })
    }

    static bindEvent() {
        let self = this
        let avatarSel = self.avatarSel
        avatarSel.addEventListener('click', function(event){
            // 我们可以通过 event.target 来得到被点击的元素
            let target = event.target as HTMLSelectElement
            // log('被点击的元素是', self, self.dataset.value, Login.avatar)
            let inputAvatar: HTMLSelectElement = e(".input-avatar")
            if (inputAvatar.value.length > 0) {
                let selected = e(`.selected`)
                selected.className = "class-avatar"
            }
            inputAvatar.value = target.dataset.value
            target.className += " selected"
        })
    }
}


Avatar.initAvatar()
Avatar.bindEvent()

