class Msg extends GuaObject {
    constructor(form) {
        super()
        let user = User.new(form)
        let msg = form.msg
        let id = form.id
        return {
            user: user,
            msg: msg,
            id: id,
        }
    }
}

class MsgContainer extends GuaObject {
    static container = 'msg-list'
    static containerSel = e(`.${this.container}`)

    static addMsg(instance) {
        // 添加一个 msg 到页面中
        let container = this.containerSel
        let t = this.msgTemplate(instance)
        appendHtml(container, t)
        //
        this.msgScrollTop()
    }

    static msgTemplate = (instance) => {
        let msg_list = e('.msg-box')
        let current_user_id = parseInt(msg_list.dataset.user_id)

        //
        if (equalsInt(instance.user.id, current_user_id)) {
            let t = `
            <div class="msg-cell-me">
                <div class="msg-cell-body">
                    <div class="msg-cell-me-username">
                        我
                    </div>
                    <div id="msg-cell-me-msg" class='msg-cell-msg' data-msg_id=${instance.id}>
                        ${instance.msg}
                    </div>
                </div>
                <div class="msg-cell-avatar">
                    <img class="msg-cell-avatar-img" src="/static/img/avatar/${instance.user.avatar}">
                </div>
            </div>
        `
            return t
        } else {
            let t = `
            <div class="msg-cell-you">
                <div class="msg-cell-avatar">
                    <img class="msg-cell-avatar-img" src="/static/img/avatar/${instance.user.avatar}">
                </div>
                <div class="msg-cell-body">
                    <div class="msg-cell-you-username">
                        ${instance.user.username}
                    </div>
                    <div id="msg-cell-you-msg" class='msg-cell-msg' data-msg_id=${instance.id}>
                        ${instance.msg}
                    </div>
                </div>
            </div>
        `
            return t
        }
    }

    static msgScrollTop = () => {
        // 保持聊天记录为最新
        let container = MsgContainer.containerSel
        container.scrollTop = container.scrollHeight
    }

    static addNotice = (instance, action) => {
        // 添加一个 msg 到页面中
        let container = this.containerSel
        let t = this.noticeTemplate(instance, action)
        appendHtml(container, t)
        //
        this.msgScrollTop()
    }

    static noticeTemplate = (instance, action) => {
        let n
        if (action === RoomAction.Join) {
            n = '进入了房间'
        } else {
            n = '离开了房间'
        }
        let t = `
            <div class="msg-cell-notice">${instance.username} ${n}</div>
        `
        return t
    }

    static addRead = () => {
        // 添加一个 msg 到页面中
        let container = this.containerSel
        let t = `
            <div class="msg-cell-notice">----- 上次读取到这里，往下滑动未读消息 -----</div>
        `
        appendHtml(container, t)
    }

    static clear = () => {
        let containerSel = this.containerSel
        containerSel.replaceChildren()
    }

    static addList = (array, read_id) => {
        for (let arrayElement of array) {
            let instance = Msg.new(arrayElement)
            this.addMsg(instance)
            // 设置未读
            if (equalsInt(instance.id, read_id)) {
                this.addRead()
            }
        }
    }
}