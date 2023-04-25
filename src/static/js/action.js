class Action extends GuaObject {
    static eventActions = {}

    static bindEventForAction(eventName) {
        let self = this
        bindEvent('body', eventName, function (event) {
            let t = event.target
            let action = t.dataset.action
            // 当前 event 绑定的所有 action: object
            // {actionName: actionFunction}
            let actionAllEvent = self.eventActions[eventName] || {}
            log("actionAllEvent", actionAllEvent)
            // 当前 event 绑定的所有 action 的名字
            let eventList = Object.keys(actionAllEvent)
            // 如果当前 target action 在当前 event 绑定的所有 action 中
            if (eventList.includes(action)) {
                log(`Got action:[${action}] in event[${eventName}]`)
                actionAllEvent[action](t)
            } else {
                log(`no action:[${action}] in event[${eventName}]`)
            }
        })
    }

    static bindEvent() {
        for (let eventName of Object.keys(this.eventActions)) {
            this.bindEventForAction(eventName)
        }
    }
}
