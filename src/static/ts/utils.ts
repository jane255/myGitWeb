const log = console.log.bind(console)

const e = (sel: string) : HTMLSelectElement | null => document.querySelector(sel)

const es = (sel: string) : NodeListOf<HTMLSelectElement | null> => document.querySelectorAll(sel)

const appendHtml = (element: HTMLSelectElement | null, html: string) => element.insertAdjacentHTML('beforeend', html)

const bindEvent = (element: string, eventName: string, callback: (event) => void) => {
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