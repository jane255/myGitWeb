class Action {
    static eventActions = {}

    static bindEventForAction(eventName: string) {
        let self = this
        bindEvent('body', eventName, function (event) {
            // 可以使用「类型断言」来告诉 TypeScript 该对象具有 dataset 属性
            // 使用 as 关键字将 event.target 断言为 HTMLElement 类型，这样 TypeScript 就知道该对象具有 dataset 属性
            let t = event.target as HTMLSelectElement
            let action = t.dataset.action
            // 当前 event 绑定的所有 action: object
            // {actionName: actionFunction}
            let actionAllEvent = self.eventActions[eventName] || {}
            // 当前 event 绑定的所有 action 的名字
            let eventList = Object.keys(actionAllEvent)
            log(`eventList:[${eventList}]`)
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
