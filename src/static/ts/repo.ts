class Repo extends GuaObject{
    repoName: string
    cloneAddress: string

    constructor(form: {[key: string]: string}) {
        super()
        this.repoName = form.repo_name
        this.cloneAddress = form.clone_address
    }
}

class RepoContainer {
    static input: string = 'id-input-msg'
    static inputSel: HTMLSelectElement = e(`#${this.input}`)

    static send = () => {
        let inputSel: HTMLSelectElement = this.inputSel
        let content: string = inputSel.value
        let form: apiForm = {
            "repo_name": content,
        }
        log("send form", form)
        this.addRepo(form)
    }

    static addRepo = (form: apiForm) => {
        let self = this
        API.call(Method.Post, '/repo/add', form, function(r){
            let response = JSON.parse(r)
            let repo = Repo.new(response.data) as Repo
            log('新建仓库地址', repo)
            self.showCloneAddress(repo)
        })
    }

    static showCloneAddress = (repo: Repo) => {
        let sel: HTMLSelectElement = e(`.class-clone-address`)
        sel.className += ' class-display'
        sel.innerText = repo.cloneAddress
    }
}

class ActionRepo extends Action {
    static eventActions = {
        'click': {
            'send': RepoContainer.send,
        },
    }
}