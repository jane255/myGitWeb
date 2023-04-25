class Room extends GuaObject {
    constructor(form) {
        super()
        let id = form.room_id
        let name = form.name
        return {
            name: name,
            id: id,
        }
    }
}

class RoomAction {
    static Join = 'join'
    static Leave = 'leave'
}

class RoomCreate {
    static True = true
    static False = false
}

class RoomContainer extends GuaObject {
    static container = 'msg-room-list'
    static containerSel = e(`.${this.container}`)
    //
    static input = 'add-room-input'
    static inputSel = e(`.${this.input}`)

    static addRoom(instance) {
        // 添加一个 msg 到页面中
        let container = this.containerSel
        let t = this.roomTemplate(instance)
        appendHtml(container, t)
        //
    }

    static roomTemplate = (instance) => {
        let t = `
            <div class="msg-room-name div-room-${instance.id}" data-id=${instance.id}>${instance.name}</div>
        `
        return t
    }

    static clickRoom = () => {
        let containerSel = this.containerSel
        let _this = this
        containerSel.addEventListener('click', function(event){
            let self = event.target
            if (self.classList.contains('msg-room-name')){
                let room = Room.new({
                    room_id: parseInt(self.dataset.id),
                    name: self.innerText
                })
                log("点击到了切换房间", room)
                _this.changeCurrentRoom(room, RoomCreate.False)
                // _this.enterRoom(room)
            }
        })
    }

    static enterRoom = (room) => {
        let form = {
            room_id: parseInt(room.id),
        }
        API.call(Method.Post, '/chat/detail', form, function(r){
            let response = JSON.parse(r)
            log('请求聊天消息', response)
            MsgContainer.addList(response.data.msg_list, response.data.read_id)
            MemberContainer.addList(response.data.member_list)
            //
            let socket = SocketIO.instance()
            socket.emit("join_room", room.id)
        })
    }

    // 更改当前房间标识
    static changeCurrentRoom = (room, createRoom) => {
        let body = e('.msg-body')
        // 更改当前房间 id
        body.dataset.room_id = room.id
        this.updateCurrentRoomClass(room)
        // 离开原来连接的房间
        let socket = SocketIO.instance()
        socket.emit("leave_room")
        // 清除聊天记录和群用户
        MsgContainer.clear()
        MemberContainer.clear()
        // 更改当前聊天 title
        let title = e('#id-title')
        title.innerText = room.name
        if (createRoom) {
            // 加入房间
            socket.emit("join_room", room.id)
        } else {
            this.enterRoom(room)
        }
    }

    // 调整当前房间标识
    static updateCurrentRoomClass = (room) => {
        let s = 'current-room'
        let current_room = e(`.${s}`)
        current_room.className = current_room.className.split(s).join("")
        //
        let element = e(`.div-room-${room.id}`)
        element.className += ' current-room'
    }

    static bindButton = () => {
        this.showInput()
        let inputSel = this.inputSel
        let _this = this
        //
        inputSel.addEventListener("keyup", function (event) {
            let content = inputSel.value
            log("content", content)
            if (event.keyCode === 13 && content.length > 1) {
                _this.hideInput()
                let form = {
                    name: content,
                }
                _this.createRoom(form)
            }
        })
    }

    static showInput = () => {
        let inputSel = this.inputSel
        inputSel.className += ' input-display'
    }

    static hideInput = () => {
        let inputSel = this.inputSel
        inputSel.className = this.input
        inputSel.value = ''
    }

    static createRoom = (form) => {
        let _this = this
        API.call(Method.Post, '/room/add', form, function(r){
            let response = JSON.parse(r)
            let room = Room.new(response.data)
            log('新增群成功', room)
            // // 新增群的同时、当前用户加入该群
            // // 其他用户只能在刷新页面出现新群的情况下，点击该群并加入该群
            _this.addRoom(room)
            _this.changeCurrentRoom(room, RoomCreate.True)
        })
    }

    static join = (user) => {
        MemberContainer.addMember(user)
        MsgContainer.addNotice(user, RoomAction.Join)
    }

    static leave = (user) => {
        // 自己的离线消息不用发
        let current_user_id = e('.msg-box').dataset.user_id
        if (! equalsInt(user.id, current_user_id)) {
            MemberContainer.removeMember(user)
            MsgContainer.addNotice(user, RoomAction.Leave)
        }
    }
}

class ActionRoom extends Action {
    static eventActions = {
        'click': {
            'showInput': RoomContainer.bindButton,
        },
    }
}