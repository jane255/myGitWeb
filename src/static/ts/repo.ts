class RepoContainer {
    static input: string = 'class-input-add-repo'
    static inputSel: HTMLSelectElement = e(`.${this.input}`)
    //
    static repoListSel: HTMLSelectElement = e(`.class-repo-list`)

    static initRepoList = () => {
        let self = this
        let username = window.location.pathname.substring(1)
        let box = e(`.class-box`)
        box.dataset.username = username
        //
        APIContainer.repoList(username, {}, function (r) {
            let response = JSON.parse(r)
            let respRepoList: ResponseRepoList = response.data
            let repoList: ResponseRepoListItem[] = respRepoList.repo_list
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
        // 请求后台创建新仓库
        APIContainer.repoAdd(form, function(r){
            let response = JSON.parse(r)
            let respRepoAdd: ResponseRepoAdd = response.data
            // 如果创建成功
            if (respRepoAdd.result) {
                // 增加仓库标签
                let t: string = self.template(respRepoAdd.repo_id, respRepoAdd.repo_name)
                let repoListSel: HTMLSelectElement = self.repoListSel
                appendHtml(repoListSel, t)
                // 进入仓库
                self.enterRepo(respRepoAdd.repo_id, respRepoAdd.repo_name)
            } else {
                log("仓库名字已重复")
                alert("仓库名字已重复")
            }
        })
    }

    static enterRepo = (repoId: number, repoName: string) => {
        let self = this
        self.showCurrentRepo(repoId)
        // 获取仓库信息
        let username = currentUsername()
        APIContainer.repo(username, repoName, {}, function (r) {
            let response = JSON.parse(r)
            let respRepoDetail: ResponseRepoDetail = response.data
            self.parseRepoTitle(respRepoDetail.clone_address)
            self.parseRepoFile(respRepoDetail.entries)
        })
    }

    static parseRepoFile = (entries: []) => {
        let fileListSel = e(`.class-file-list`)
        fileListSel.replaceChildren()
        for (let entry of entries) {
            let e = entry as ResponseRepoDetailFile | ResponseRepoDetailDir
            let t: string
            if (e.type == EnumFileType.file) {
                t = `
                    <div class='class-file-cell cell-file'>
                        <div class="class-file-cell-avatar">
                            <img class="img-file-cell-avatar" src="/static/img/icon/file.png">
                        </div>
                `
            } else {
                t = `
                    <div class='class-file-cell cell-folder'>
                        <div class="class-file-cell-avatar">
                            <img class="img-file-cell-avatar" src="/static/img/icon/folder.png">
                        </div>
                `
            }
            t += `
                    <div class="class-file-cell-body">
                        <a class="span-file-cell-body" data-path="${e.path}">${e.name}</a>
                    </div>
                    <div class="class-file-cell-hash">
                        <a class="span-file-cell-hash">${e.hash_code }</a>
                    </div>
                    <div class="class-file-cell-commit">
                        <a class="span-file-cell-commit">${e.commit_message }</a>
                    </div>
                    <div class="class-file-cell-date">
                        <a class="span-file-cell-date">${e.commit_time }</a>
                    </div>
                </div>
            `
            appendHtml(fileListSel, t)
        }
    }

    static parseRepoTitle = (clone_address: string) => {
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

    static clickRepo = () => {
        let self = this
        let repoListSel = self.repoListSel
        repoListSel.addEventListener('click', function(event){
            let target = event.target as HTMLSelectElement
            if (target.className.includes("class-repo-name")) {
                let repoId = parseInt(target.dataset.id)
                let repoName = target.innerText
                self.enterRepo(repoId, repoName)
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
