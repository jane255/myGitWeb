const log = console.log.bind(console)

const e = (sel: string) : HTMLSelectElement => document.querySelector(sel)

const es = (sel: string) : NodeListOf<HTMLSelectElement> => document.querySelectorAll(sel)

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
            responseCallback(a.response)
        }
    }
}

class GuaObject {
    constructor(...args: any[]) {

    }

    static new(...args: any[])  {
        return new this(...args)
    }
}

const currentUsername = () : string => e(`.class-username`).innerText

const currentRepoName = () : string => e(`.class-repo-body`).dataset.repo
