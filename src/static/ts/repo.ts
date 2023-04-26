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
    static input: string = 'class-input-add-repo'
    static inputSel: HTMLSelectElement = e(`.${this.input}`)
    //
    static repoListSel: HTMLSelectElement = e(`.class-repo-list`)

    static bindButton = () => {
        this.showInput()
        let inputSel = this.inputSel
        let _this = this
        //
        inputSel.addEventListener("keyup", function (event) {
            let content = inputSel.value
            if (event.code === "Enter" && content.length > 1) {
                _this.hideInput()
                log("创建新仓库名", content)
                let form: apiForm = {
                    "repo_name": content,
                }
                _this.addRepo(form)
            }
        })
    }

    static addRepo = (form: apiForm) => {
        let self = this
        API.call(Method.Post, '/repo/add', form, function(r){
            let response = JSON.parse(r)
            let respRepoAdd: RespRepoAdd = response.data
            if (respRepoAdd.result) {
                let t: string = self.template(respRepoAdd.repo_id, respRepoAdd.repo_name)
                let repoListSel: HTMLSelectElement = self.repoListSel
                appendHtml(repoListSel, t)
            } else {
                alert("仓库名字已重复")
            }
        })
    }

    static showCloneAddress = (repo: Repo) => {
        let sel: HTMLSelectElement = e(`.class-clone-address`)
        sel.className += ' class-display'
        sel.innerText = repo.cloneAddress
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

    static initRepoList = () => {
        let self = this
        API.call(Method.Get, '/repo/list', {}, function(r){
            let response = JSON.parse(r)
            let respRepoList: RespRepoList = response.data
            let repoList: RespRepoListItem[] = respRepoList.repo_list
            //
            let repoListSel: HTMLSelectElement = self.repoListSel
            for (let e of repoList) {
                let t = self.template(e.repo_id, e.repo_name)
                appendHtml(repoListSel, t)
            }
        })
    }

    static template = (repoId, repoName) => {
        let t = `
            <div class="class-repo-name repo-id-${repoId}" data-id=${repoId}>${repoName}</div>
        `
        return t
    }
}

class ActionRepo extends Action {
    static eventActions = {
        'click': {
            'showInput': RepoContainer.bindButton,
        },
    }
}
