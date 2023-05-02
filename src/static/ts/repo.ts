class RepoContainer {
    static filesBodySel: HTMLSelectElement = e(`.class-files-tboody`)

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
            log("responseRepoDetail", responseRepoDetail)
            // 设置仓库名
            self.parseRepoName(responseRepoDetail.username, responseRepoDetail.repo_name)
            // 设置描述
            self.parseDesc()
            // 设置克隆地址
            self.parseCloneUrl(responseRepoDetail.clone_address)
            // 设置分支
            self.parseUiBreadcrumb(repoName)
            // 解析文件，如果有 readme.md 文件，要可视化出来
            self.parseFilesBody(responseRepoDetail.entries)
        })
    }

    static parseRepoName = (username: string, repoName: string) => {
        let headerRepoSel = e(`.class-repo-name`)
        this.clearChildren(headerRepoSel)
        appendHtml(headerRepoSel, `
            <i class="mega-octicon octicon-repo"></i>
            <a href="/${username}">${username}</a>
            <div class="divider"> /</div>
            <a href="/${username}/${repoName}">${repoName}</a>
        `)
    }

    static parseDesc = () => {
        this.removeDesc()
        let t: string = `
                <span class="no-description text-italic">No Description</span>
                <a class="link" href=""></a>
        `
        appendHtml(e(`#repo-desc`), t)
    }

    static parseCloneUrl = (cloneAddress: string) => {
        let sel = e(`#clone-panel`)
        this.clearChildren(sel)
        let t = `
            <button class="ui basic clone button blue" id="repo-clone-https"
                                data-link="${cloneAddress}">
                            HTTPS
            </button>
            <input id="repo-clone-url" value="${cloneAddress}" readonly="">
            <button class="ui basic icon button poping up clipboard" id="clipboard-btn" data-original="Copy"
                    data-success="Copied!" data-error="Press ⌘-C or Ctrl-C to copy" data-content="Copy"
                    data-variation="inverted tiny" data-clipboard-target="#repo-clone-url">
                <i class="octicon octicon-clippy"></i>
            </button>
            <div class="ui basic jump dropdown icon button" tabindex="0">
                <i class="download icon"></i>
                <div class="menu" tabindex="-1">
                    <a class="item" href="/haxi/gitWeb/archive/master.zip"><i
                            class="octicon octicon-file-zip"></i> ZIP</a>
                    <a class="item" href="/haxi/gitWeb/archive/master.tar.gz"><i
                            class="octicon octicon-file-zip"></i> TAR.GZ</a>
                </div>
            </div>
        `
        appendHtml(sel, t)
    }

    static parseUiBreadcrumb = (repoName: string) => {
        let sel = e(`.class-ui-breadcrumb`)
        this.clearChildren(sel)
        let pathname = window.location.pathname
        let t = `
            <a class="section class-path-section" data-path="${pathname}/src/master">${repoName}</a>
        `
        appendHtml(sel, t)
    }

    static parseFilesBody = (entries: [], hasParent: boolean = false, path: string=null) => {
        let filesBodySel: HTMLSelectElement = this.filesBodySel
        // clear
        this.clearChildren(filesBodySel)
        //
        if (hasParent) {
            this.appendParent(path)
        }
        let pathname: string = window.location.pathname
        // 判断是否有 readme  文件
        let hasReadme: boolean = false
        for (let e of entries) {
            let entry = e as ResponseRepoDetailFile | ResponseRepoDetailDir
            let span: string
            let name = entry.name
            //
            if (name == "README.md") {
                hasReadme = true
            }
            let hashCode = entry.hash_code
            let commit = entry.commit_message
            let ct = entry.commit_time
            let type = entry.type
            let _path = entry.path
            if (type == EnumFileType.dir) {
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
                        <a class="a-files-path-name" data-path="${pathname}/src/master/${_path}" data-type="${type}">${name}</a>
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
        // 可视化 readme
        if (hasReadme) {
            this.parseReadme()
        }
    }

    static parseReadme = () => {
        this.clearFileContent()
        let t = `
                <h4 class="ui top attached header" id="repo-readme">
                    <i class="octicon octicon-book"></i>
                    <strong>README.md</strong>
                </h4>
                <div class="ui unstackable attached table segment">
                    <div id="" class="file-view markdown has-emoji">

                        <div id="gitweb" class="anchor-wrap"><h1>gitWeb<a class="anchor" href="#gitweb"><span
                                class="octicon octicon-link"></span></a></h1></div>
                    </div>
                </div>
        `
        appendHtml(e(`#file-content`), t)
    }

    static clearChildren = (sel: HTMLSelectElement) => {
        sel.replaceChildren()
    }

    static parseFilesSuffixBody = (entries: [], path: string) => {
        // 删除描述
        this.removeDesc()
        // 解析文件路径
        this.parseFilesPath(path)
        // 删除克隆地址
        this.removeClonePanel()
        // 解析文件
        this.parseFilesBody(entries, true, path)
        // 删除 readme
        this.clearFileContent()
    }

    static removeDesc = () => {
        let sel: HTMLSelectElement = e(`#repo-desc`)
        this.clearChildren(sel)
    }

    static parseFilesPath = (path: string) => {
        // 解析路径，假设路径是 /gua/axe/src/master/bala
        // ['', 'gua', 'axe', 'src', 'master', 'bala']
        let pathPrefix = path.split('/').splice(0, 5).join('/')
        let pathSuffixList = path.split('/').splice(5)
        let length = pathSuffixList.length
        let sel = e(`.class-ui-breadcrumb`)
        for (let i = 0; i < length; i++) {
            let t: string
            let p: string = pathSuffixList[i]
            pathPrefix += '/' + p
            if (i + 1 == length) {
                t = `
                    <div class="divider"> / </div>
                    <span class="active section class-path-section">${p}</span>
                `
            } else {
                t = `
                    <div class="divider"> / </div>
                    <span class="section class-path-section"><a data-path="${pathPrefix}">${p}</a></span>
                `
            }
            appendHtml(sel, t)
        }
    }

    static removeClonePanel = () => {
        let filesBodySel: HTMLSelectElement = this.filesBodySel
        this.clearChildren(filesBodySel)
        //
        let cloneSel: HTMLSelectElement = e(`#clone-panel`)
        this.clearChildren(cloneSel)
    }

    static appendParent = (path: string) => {
        let filesBodySel: HTMLSelectElement = this.filesBodySel
        let pathArray = path.split('/')
        let pathParent = pathArray.splice(0, pathArray.length - 1).join('/')
        appendHtml(filesBodySel, this.fileParentTemplate(pathParent))
    }

    static fileParentTemplate = (path: string) => {
        let t: string = `
            <tr class="has-parent">
                <td colspan="3">
                <i class="octicon octicon-mail-reply"></i>
                <a class="a-files-path-name" data-path="${path}">..</a></td>
            </tr>
        `
        return t
    }

    static clearFileContent = () => {
        let sel = e(`#file-content`)
        this.clearChildren(sel)
    }

    static bindPathSectionEvent = () => {
        let self = this
        let sel = e(`.class-ui-breadcrumb`)
        sel.addEventListener('click', function(event){
            let target = event.target as HTMLSelectElement
            if (target.className.includes("class-path-section")) {
                let path: string = target.dataset.path
                let type: EnumFileType = EnumFileType.dir
                let form = {
                    type: type
                }
                if (path.split('/').length == 5) {
                    self.initRepoDetail()
                } else {
                    APIContainer.repoSuffix(`${path}`, form, function (r) {
                        let response = JSON.parse(r)
                        log("response:", response.data)
                        let res: ResponserRepoSuffix = response.data
                        self.parseFilesSuffixBody(res.entries, res.path)
                    })
                }
            }
        })
    }

    static parseFile = (path: string, content: string) => {
        // 删除描述
        this.removeDesc()
        // 删除 commits 栏位
        this.removeGitStats()
        // 隐藏 newFile uploadFile
        this.hideFileButtons()
        // 删除克隆
        this.removeClonePanel()
        // 隐藏最新 commit
        this.hideRepoFilesTable()
        // 解析当前文件路径
        this.parseFilesPath(path)
        // 添加文本标题栏
        this.appendRepoReadFile(path)
        // 添加文本框
        this.appendFileContent(content)
    }

    static removeGitStats = () => {
        let sel = e(`#git-stats`)
        this.clearChildren(sel)
    }

    static hideFileButtons = () => {
        let sel = e(`#file-buttons`)
        sel.style.display = 'none'
    }

    static displayFileButtons = () => {
        let sel = e(`#file-buttons`)
        sel.style.display = 'inline-flex'
    }

    static hideRepoFilesTable = () => {
        let sel = e(`#repo-files-table`)
        sel.style.display = 'none'
    }

    static displayRepoFilesTable = () => {
        let sel = e(`#repo-files-table`)
        sel.style.display = 'table'
    }

    static appendRepoReadFile = (path: string) => {
        this.clearFileContent()
        let sel = e(`#file-content`)
        let filename = path.split('/').splice(-1)
        let t: string = `
            <h4 class="ui top attached header" id="repo-read-file">
                <i class="octicon octicon-file-text ui left"></i>
                <strong>${filename}</strong> 
                <span class="text grey normal">4 B</span>
                <div class="ui right file-actions">
                    <div class="ui buttons">
                        <a class="ui button" href="/haxi/gitWeb/src/a61c249028cd1120582f506a68bf8fecc6a3b099/test1.txt">Permalink</a>
                        <a class="ui button" href="/haxi/gitWeb/commits/master/test1.txt">History</a>
                        <a class="ui button" href="/haxi/gitWeb/raw/master/test1.txt">Raw</a>
                    </div>
                    <a href="/haxi/gitWeb/_edit/master/test1.txt"><i class="octicon octicon-pencil btn-octicon poping up" data-content="Edit this file" data-position="bottom center" data-variation="tiny inverted"></i></a>
                    <a href="/haxi/gitWeb/_delete/master/test1.txt"><i class="octicon octicon-trashcan btn-octicon btn-octicon-danger poping up" data-content="Delete this file" data-position="bottom center" data-variation="tiny inverted"></i></a>
                </div>
           </h4>
        `
        appendHtml(sel, t)
    }

    static appendFileContent = (content: string) => {
        let contentList = content.split('\n')
        let spanTemplate: string = ``
        let liTemplate: string = ``
        for (let i = 0; i < contentList.length; i++) {
            let offset = (i+1).toString()
            spanTemplate += `
                <span id="L${offset}">${offset}</span>
            `
            liTemplate += `
                <li class="L${offset}" rel="L${offset}"></li>
            `
        }
        let sel = e(`#file-content`)
        let t = `
            <div class="ui unstackable attached table segment">
                <div id="" class="file-view code-view has-emoji">
                    <table>
                        <tbody>
                            <tr>
                                <td class="lines-num">
                                      ${spanTemplate}
                                </td>
                                <td class="lines-code">
                                    <pre>
                                        <code class="nohighlight">
                                            <ol class="linenums">
                                                ${liTemplate}
                                            </ol>
                                        </code>
                                    </pre>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `
        appendHtml(sel, t)
        // 这时候才插入文本，为了保证文本不被执行（假设文本里有 html 代码
        for (let i = 0; i < contentList.length; i++) {
            let liSel = e(`.L${(i + 1).toString()}`)
            liSel.innerText = contentList[i]
        }
    }
}

class ActionRepo extends Action {
    static eventActions = {
        'click': {
            // 'showInput': RepoContainer.bindButton,
            // 'clickRepo': RepoContainer.clickRepo,
        },
    }
}
