const log = console.log.bind(console)

const e = (sel) => document.querySelector(sel)

const es = (sel) => document.querySelectorAll(sel)

const appendHtml = (element, html) => element.insertAdjacentHTML('beforeend', html)

const bindEvent = (element, eventName, callback) => {
    element = e(element)
    element.addEventListener(eventName, callback)
}

const formatTime = (t) => {
    // format unix timestamp to string
    let d = new Date(t * 1000)
    let year = d.getFullYear()
    let month = d.getMonth() + 1
    let day = d.getDate()
    return `${year}-${month}-${day}`
}

const ajax = (method, path, data, responseCallback) => {
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
        return new this(...args)
    }
}

const randomAvatar = () => {
    // 获取 img/avatar 目录下的所有图片名
    let images = [
        'Nintendo_Switch_Princess_Zelda_TWWHD_Icon.png',
        'Nintendo_Switch_Urbosa_Icon.png',
        'Nintendo_Switch_Daruk_Icon.png',
        'Nintendo_Switch_Revali_Icon.png',
        'Nintendo_Switch_Guardian_Icon.png',
        'Nintendo_Switch_Master_Sword_Hylian_Shield_Icon.png',
        'Nintendo_Switch_Link_Series_Icon.png',
        'Nintendo_Switch_Link_BotW_Icon.png',
        'Nintendo_Switch_Wingcrest_Icon.png',
        'Nintendo_Switch_Bokoblin_Icon.png',
        'Nintendo_Switch_Daruk_Icon-1.png',
        'Nintendo_Switch_Zelda_BotW_Icon.png',
        'Nintendo_Switch_Ganondorf_TWWHD_Icon.png',
        'Nintendo_Switch_funny.png',
        'Nintendo_Switch_Mipha_Icon.png',
        'Nintendo_Switch_Link_TWWHD_Icon.png',
        'Nintendo_Switch_Ganondorf_TPHD_Icon.png',
        'Nintendo_Switch_Princess_Zelda_TPHD_Icon.png',
        'Nintendo_Switch_Kass_Icon.png',
        'Nintendo_Switch_Link_TP_Icon.png',
    ]
    let index = Math.floor(Math.random() * images.length)
    let name = images[index]
    return `../static/img/avator/${name}`
}

const equalsInt = (int1, int2) => {
    return parseInt(int1) === parseInt(int2)
}