class Repo extends GuaObject {
    constructor(form) {
        super()
        let repo_name = form.repo_name
        let clone_address = form.clone_address
        return {
            repo_name: repo_name,
            clone_address: clone_address,
        }
    }
}

class RepoContainer extends GuaObject {
    static input = 'id-input-msg'
    static inputSel = e(`#${this.input}`)

    static send = () => {
        let inputSel = this.inputSel
        let content = inputSel.value
        let form = {
            repo_name: content,
        }
        this.addRepo(form)
    }

    static addRepo = (form) => {
        let self = this
        API.call(Method.Post, '/repo/add', form, function(r){
            let response = JSON.parse(r)
            let repo = Repo.new(response.data)
            log('新建仓库地址', repo)
            self.showCloneAddress(repo)
        })
    }

    static showCloneAddress = (repo) => {
        let sel = e(`.class-clone-address`)
        sel.className += ' class-display'
        sel.innerText = repo.clone_address
    }
}

class ActionRepo extends Action {
    static eventActions = {
        'click': {
            'send': RepoContainer.send,
        },
    }
}