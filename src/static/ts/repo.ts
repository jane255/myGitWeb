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
        let path: string = '/repo/add'
        // 请求后台创建新仓库
        API.call(Method.Post, path, form, function(r){
            let response = JSON.parse(r)
            let respRepoAdd: RespRepoAdd = response.data
            log(`${path} -- 请求后台结果: ${JSON.stringify(respRepoAdd)}`)
            // 如果创建成功
            if (respRepoAdd.result) {
                // 增加仓库标签
                let t: string = self.template(respRepoAdd.repo_id, respRepoAdd.repo_name)
                let repoListSel: HTMLSelectElement = self.repoListSel
                appendHtml(repoListSel, t)
                // 进入仓库
                self.enterRepo(respRepoAdd.repo_id)
            } else {
                log("仓库名字已重复")
                alert("仓库名字已重复")
            }
        })
    }

    static enterRepo = (repoId: number) => {
        let self = this
        self.showCurrentRepo(repoId)
        let path: string = '/repo/detail'
        let form: apiForm = {
            "repo_id": repoId,
        }
        // 获取仓库信息
        API.call(Method.Post, path, form, function(r){
            let response = JSON.parse(r)
            let respRepoDetail: RespRepoDetail = response.data
            // log(`${path} -- 请求后台结果: ${JSON.stringify(respRepoDetail)}`)
            self.showRepoTitle(respRepoDetail.clone_address)
        })
    }

    static showRepoTitle = (clone_address: string) => {
        let sel = e(`#id-repo-title`)
        sel.innerText = clone_address
    }

    static showCurrentRepo = (repoId: number) => {
        let s = `current-repo`
        let currentRepoSel = e(`.${s}`)
        if (currentRepoSel !== null) {
            currentRepoSel.className = 'class-repo-name'
        }
        let idRepoSel = e(`#class-repo-id-${repoId.toString()}`)
        idRepoSel.className += ' ' + s
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
            <div class="class-repo-name" id="class-repo-id-${repoId}" data-id=${repoId}>${repoName}</div>
        `
        return t
    }

    static clickRepo = () => {
        let repoListSel = e(`.class-repo-list`)
        let self = this
        repoListSel.addEventListener('click', function(event){
            let target = event.target as HTMLSelectElement
            if (target.className.includes("class-repo-name")) {
                let repoId = parseInt(target.dataset.id)
                self.enterRepo(repoId)
            }
        })
    }
}

class ActionRepo extends Action {
    static eventActions = {
        'click': {
            'showInput': RepoContainer.bindButton,
            // 'clickRepo': RepoContainer.clickRepo,
        },
    }
}
