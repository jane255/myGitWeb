const log = console.log.bind(console)

const e = (sel: string) :Element => document.querySelector(sel)

const es = (sel: string) :NodeListOf<Element> => document.querySelectorAll(sel)

const appendHtml = (element: Element, html: string) => element.insertAdjacentHTML('beforeend', html)

const bindEvent = (element: string, eventName: string, callback: () => void) => {
    let ele = e(element)
    ele.addEventListener(eventName, callback)
}

const ajax = (method: string, path: string, data: Object, responseCallback: (response: any) => void) => {
    let a = new XMLHttpRequest()
    a.open(method, path, true)
    a.setRequestHeader('Content-Type', 'application/json')
    a.send(JSON.stringify(data))
    a.onreadystatechange = () => {
        if (a.readyState === 4) {
            responseCallback(a.response)
        }
    }
}

class GuaObject {
    static new(...args) {
        // @ts-ignore
        return new this(...args)
    }
}