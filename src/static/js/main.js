const __main = function() {
    // https://socket.io/docs/v4/client-options/#auth
    // https://flask-socketio.readthedocs.io/en/latest/getting_started.html#connection-events

    MsgContainer.msgScrollTop()
    SocketIO.bindEvent()
    ActionChat.bindEvent()
    ActionRoom.bindEvent()
    RoomContainer.clickRoom()
}

__main()
