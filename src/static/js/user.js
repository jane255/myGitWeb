class User extends GuaObject {
    constructor(form) {
        super()
        let username = form.username
        let id = form.user_id
        let avatar = form.avatar
        return {
            username: username,
            id: id,
            avatar: avatar,
        }
    }
}
