const log = console.log.bind(console)

const e = (sel: string): HTMLSelectElement => document.querySelector(sel)

const es = (sel: string): NodeListOf<HTMLSelectElement> => document.querySelectorAll(sel)

const appendHtml = (element: HTMLSelectElement, html: string) => {
    element.insertAdjacentHTML('beforeend', html)
}

const prependHtml = (element: HTMLSelectElement, html: string) => {
    element.insertAdjacentHTML('afterbegin', html)
}

const bindEvent = (element: string, eventName: string, callback: EventCallback) => {
    let ele = e(element)
    ele.addEventListener(eventName, callback)
}

const ajax = (method: string, path: string, data: Object, responseCallback: ResponseCallback) => {
    let a = new XMLHttpRequest()
    a.open(method, path, true)
    a.setRequestHeader('Content-Type', 'application/json')
    a.send(JSON.stringify(data))
    a.onreadystatechange = () => {
        if (a.readyState === XMLHttpRequest.DONE) {
            log("api response ----", JSON.parse(a.response).data)
            responseCallback(a.response)
        }
    }
}

class GuaObject {
    constructor(...args: any[]) {

    }

    static new(...args: any[]) {
        return new this(...args)
    }
}

const currentUsername = (): string => e(`.class-username`).innerText

const currentRepoName = (): string => e(`.class-repo-body`).dataset.repo

// 转义 html 脚本
const escapeHTML = (s): string => {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;")
}

// 解析 diff 的 变更总行数
// 比如 @@ -1,2 +1,2 @@，旧行里是 -1,2，也就是 2 行，新行里是 +1,2，也是两行
const parseDiffLinesNum = (lineLimit: string) => {
    if (lineLimit.startsWith('+') || lineLimit.startsWith('-')) {
        lineLimit = lineLimit.substring(1)
    }
    let start: number
    let end: number
    if (lineLimit.includes(',')) {
        let lineLimitList = lineLimit.split(',')
        start = parseInt(lineLimitList[0])
        end = parseInt(lineLimitList[1])
    } else
        start = parseInt(lineLimit)
        end = 0
    return start
}
