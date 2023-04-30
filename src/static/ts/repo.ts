class RepoContainer {

    // 初始化仓库列表
    static initRepoList = () => {
        let self = this
        let username = window.location.pathname.substring(1)
        let usernameSel = e(`.class-username`)
        usernameSel.innerText = username
        //
        APIContainer.repoList(username, function (r) {
            let response = JSON.parse(r)
            let respRepoList: ResponseRepoList = response.data
            let repoList: ResponseRepoListItem[] = respRepoList.repo_list
            //
            let repoListSel: HTMLSelectElement = e(`.class-repository-list`)
            for (let e of repoList) {
                let t = self.repositoryTemplate(e)
                appendHtml(repoListSel, t)
            }
        })
    }

    static repositoryTemplate = (repoItem: ResponseRepoListItem) => {
        let username = currentUsername()
        let repoName = repoItem.repo_name
        let createTime = repoItem.create_time
        let t = `
            <div class="item">  
                <div class="ui grid">
                    <div class="ui two wide column middle aligned center">
                        <i class="mega-octicon octicon-repo"></i>
                    </div>
                    <div class="ui fourteen wide column no-padding-left">
                        <div class="ui header">
                            <a class="name" href="/${username}/${repoName}">${repoName}</a>
                            <div class="ui right metas">
                                <span class="text grey"><i class="octicon octicon-star"></i> 0</span>
                                <span class="text grey"><i class="octicon octicon-git-branch"></i> 0</span>
                            </div>
                        </div>
                        <p class="time">Created <span class="time-since poping up">${createTime}</span></p>
                    </div>
                </div>
            </div>        
        `
        return t
    }

    // 初始化仓库详情
    static initRepoDetail = () => {
        let self = this
        let paths = window.location.pathname.split('/')
        let username = paths[1]
        let repoName = paths[2]
        //
        APIContainer.repoDetail(username, repoName, function (r) {
            let response = JSON.parse(r)
            let responseRepoDetail: ResponseRepoDetail = response.data
            // 设置仓库名
            let headerRepoSel = e(`.class-header-breadcrumb`)
            let username: string = responseRepoDetail.username
            let repoName: string = responseRepoDetail.repo_name
            appendHtml(headerRepoSel, `
                <i class="mega-octicon octicon-repo"></i>
                <a href="/${username}">${username}</a>
                <div class="divider"> /</div>
                <a href="/${username}/${repoName}">${repoName}</a>
            `)
            // 设置克隆地址
            self.parseCloneUrl(responseRepoDetail.clone_address)
            // 设置文件
            self.parseUiBreadcrumb(repoName)
            self.parseFilesBody(responseRepoDetail.entries)
        })
    }

    static parseUiBreadcrumb = (repoName: string) => {
        let pathname = window.location.pathname
        let t = `
            <a class="section" href="${pathname}/src/master">${repoName}</a>
        `
        let sel = e(`.class-ui-breadcrumb`)
        appendHtml(sel, t)
    }

    static parseCloneUrl = (cloneAddress: string) => {
        let inputSel = e(`#repo-clone-url`)
        inputSel.value = cloneAddress
        //
        let httpsSel = e(`#repo-clone-https`)
        httpsSel.dataset.link = cloneAddress
    }

    static parseFilesBody = (entries: []) => {
        let filesBodySel: HTMLSelectElement = e(`.class-files-tboody`)
        let pathname = window.location.pathname
        for (let e of entries) {
            let entry = e as ResponseRepoDetailFile | ResponseRepoDetailDir
            let span: string
            let name = entry.name
            let hashCode = entry.hash_code
            let commit = entry.commit_message
            let ct = entry.commit_time
            if (entry.type == EnumFileType.dir) {
                span = `
                    <span class="octicon octicon-file-directory"></span>
                `
            } else {
                span = `
                    <span class="octicon octicon-file-text"></span>
                `
            }
            let t = `
                    <tr>
                    <td class="name">
                        ${span}
                        <a href="${pathname}/src/master/${name}">${name}</a>
                    </td>
                    <td class="message collapsing has-emoji">
                        <a rel="nofollow" class="ui sha label"
                           href="${pathname}/commit/${hashCode}">${hashCode.substring(0, 10)}</a>
                        ${commit}
                    </td>
                    <td class="text grey right age"><span>${ct}</span></td>
                </tr>
            `
            appendHtml(filesBodySel, t)
        }
    }

    // static bindButton = () => {
    //     this.showInput()
    //     let inputSel = this.inputSel
    //     let _this = this
    //     //
    //     inputSel.addEventListener("keyup", function (event) {
    //         let content = inputSel.value
    //         if (event.code === "Enter" && content.length > 1) {
    //             _this.hideInput()
    //             log("创建新仓库名", content)
    //             let form: apiForm = {
    //                 "repo_name": content,
    //             }
    //             _this.addRepo(form)
    //         }
    //     })
    // }
    //
    // static addRepo = (form: apiForm) => {
    //     let self = this
    //     // 请求后台创建新仓库
    //     APIContainer.repoAdd(form, function(r){
    //         let response = JSON.parse(r)
    //         let respRepoAdd: ResponseRepoAdd = response.data
    //         // 如果创建成功
    //         if (respRepoAdd.result) {
    //             // 增加仓库标签
    //             let t: string = self.template(respRepoAdd.repo_id, respRepoAdd.repo_name)
    //             let repoListSel: HTMLSelectElement = self.repoListSel
    //             appendHtml(repoListSel, t)
    //             // 进入仓库
    //             self.enterRepo(respRepoAdd.repo_id, respRepoAdd.repo_name)
    //         } else {
    //             log("仓库名字已重复")
    //             alert("仓库名字已重复")
    //         }
    //     })
    // }
    //
    // static enterRepo = (repoId: number, repoName: string) => {
    //     let self = this
    //     self.showCurrentRepo(repoId, repoName)
    //     // 获取仓库信息
    //     let username = currentUsername()
    //     APIContainer.repo(username, repoName, {}, function (r) {
    //         let response = JSON.parse(r)
    //         let respRepoDetail: ResponseRepoDetail = response.data
    //         // 解析菜单栏
    //         self.parseRepoMenu(respRepoDetail.clone_address)
    //         self.parseRepoDir(respRepoDetail.entries)
    //     })
    // }
    //
    // static parseRepoFile = (path: string, content: string) => {
    //     let tableSel = this.tableSel
    //     this.clearElement(tableSel)
    //     // 添加文本
    //     let contentList = content.split('\n')
    //     let liTemplate: string = ``
    //     for (let i = 0; i < contentList.length; i++) {
    //         liTemplate += `
    //             <li class="class-file-content-${i + 1}"></li>
    //         `
    //     }
    //     let t = `
    //         <div id="id-file-content" class="tab-size-8">
    //             <strong class="repo-read-file">${path}</strong>
    //             <tbody class="class-files-body">
    //                 <tr style="text-align: left">
    //                     <td>
    //                         <code><ol>${liTemplate}</ol></code>
    //                     </td>
    //                 </tr>
    //             </tbody>
    //         </div>
    //     `
    //     appendHtml(tableSel, t)
    //     // 填充文本
    //     for (let i = 0; i < contentList.length; i++) {
    //         let liSel = e(`.class-file-content-${i + 1}`)
    //         liSel.innerText = contentList[i]
    //     }
    // }
    //
    // static clearElement = (sel: HTMLSelectElement) => {
    //     sel.replaceChildren()
    // }
    //
    // static parseRepoMenu = (clone_address: string) => {
    //     // 清除菜单栏
    //     let sel = e(`.class-repo-menu`)
    //     this.clearElement(sel)
    //     //
    //     let menuTemplate = `
    //         <div class="class-item-choose">分支</div>
    //         <div class="class-item-clone">
    //             <button>https</button>
    //             <input class="class-clone-input" value="${clone_address}">
    //         </div>
    //     `
    //     appendHtml(sel, menuTemplate)
    // }
    //
    // static showCurrentRepo = (repoId: number, repoName: string) => {
    //     let s = `current-repo`
    //     let currentRepoSel = e(`.${s}`)
    //     if (currentRepoSel !== null) {
    //         currentRepoSel.className = 'class-repo-name'
    //     }
    //     let idRepoSel = e(`#class-repo-id-${repoId.toString()}`)
    //     idRepoSel.className += ' ' + s
    //     //
    //     let body = e(`.class-repo-body`)
    //     body.dataset.repo = repoName
    // }
    //
    // static showInput = () => {
    //     let inputSel = this.inputSel
    //     inputSel.className += ' input-display'
    // }
    //
    // static hideInput = () => {
    //     let inputSel = this.inputSel
    //     inputSel.className = this.input
    //     inputSel.value = ''
    // }
    //
    // static clickRepo = () => {
    //     let self = this
    //     let repoListSel = self.repoListSel
    //     repoListSel.addEventListener('click', function(event){
    //         let target = event.target as HTMLSelectElement
    //         if (target.className.includes("class-repo-name")) {
    //             let repoId = parseInt(target.dataset.id)
    //             let repoName = target.innerText
    //             self.enterRepo(repoId, repoName)
    //         }
    //     })
    // }
}

class ActionRepo extends Action {
    static eventActions = {
        'click': {
            // 'showInput': RepoContainer.bindButton,
            // 'clickRepo': RepoContainer.clickRepo,
        },
    }
}
