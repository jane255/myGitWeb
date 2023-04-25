class MemberContainer extends GuaObject {
    static container = 'member-list'
    static containerSel = e(`.${this.container}`)

    static addMember(instance) {
        let sel = e(`#msg-member-cell-${instance.id}`)
        if (sel === null) {
            // 添加一个 msg 到页面中
            let container = this.containerSel
            let t = this.memberTemplate(instance)
            appendHtml(container, t)
        }
    }

    static removeMember(instance) {
        let m = e(`#msg-member-cell-${instance.id}`)
        log("removeMember", instance.id, m)
        m.remove()
        //
    }

    static memberTemplate = (instance) => {
        let t = `
            <div class="msg-member-cell"  id="msg-member-cell-${instance.id}">
                <div class="msg-member-avatar">
                    <img class="msg-member-avatar-img" src="/static/img/avatar/${instance.avatar}">
                </div>
                <div class="msg-member-username">${instance.username}</div>
            </div>
        `
        return t
    }

    static clear = () => {
        let containerSel = this.containerSel
        containerSel.replaceChildren()
    }

    static addList = (array) => {
        for (let arrayElement of array) {
            let instance = User.new(arrayElement)
            this.addMember(instance)
        }
    }
}
