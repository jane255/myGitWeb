class RepoContainer {
    static bodyWrapperSel: HTMLSelectElement = e(`.body-wrapper`)

    // 首页 -- 初始化仓库列表
    static initRepoList = () => {
        let self = this
        let username = window.location.pathname.substring(1)
        let usernameSel = e(`.class-username`)
        usernameSel.innerText = username
        //
        APIContainer.repoList(username, function (r) {
            let response = JSON.parse(r)
            let respRepoList: ResponseRepoList = response.data
            // 解析仓库列表
            self._parseRepoList(respRepoList.repo_list)
        })
    }

    static _parseRepoList = (repoList: ResponseRepoListItem[]) => {
        let repoListSel: HTMLSelectElement = e(`.class-repository-list`)
            for (let e of repoList) {
                let t = this._templateRepo(e)
                appendHtml(repoListSel, t)
        }
    }

    static _templateRepo = (repoItem: ResponseRepoListItem) => {
        let username = currentUsername()
        let repoName = repoItem.repo_name
        let createTime = repoItem.create_time
        let t: string = `
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
    static initRepo = () => {
        let self = this
        let paths = window.location.pathname.split('/')
        let username = paths[1]
        let repoName = paths[2]
        //
        APIContainer.repoDetail(username, repoName, function (r) {
            let response = JSON.parse(r)
            let responseRepoDetail: ResponseRepoDetail = response.data
            log("responseRepoDetail", responseRepoDetail)
            // 设置左上角用户名和仓库名
            self._parseRepoName(username, repoName)
            // 清空页面 body-wrapper
            self._clearBodyWrapper()
            // 添加描述栏
            self._parseDesc()
            // 添加 commits 栏
            self._parseGitStats()
            // 添加二级菜单，包括分支栏、当前目录栏、新文件栏、克隆栏
            self._parseSecondaryMenu(responseRepoDetail.path, responseRepoDetail.clone_address)
            // 解析文件，包括最新 commit 栏、文件目录栏、readme.md 栏位
            self._appendFilesTable(responseRepoDetail.entries, responseRepoDetail.path)
        })
    }

    static _clearBodyWrapper = () => {
        this._clearChildren(this.bodyWrapperSel)
    }

    static _clearChildren = (sel: HTMLSelectElement) => {
        sel.replaceChildren()
    }

    static _parseRepoName = (username: string, repoName: string) => {
        let headerRepoSel = e(`.class-repo-name`)
        this._clearChildren(headerRepoSel)
        appendHtml(headerRepoSel, `
            <i class="mega-octicon octicon-repo"></i>
            <a href="/${username}">${username}</a>
            <div class="divider"> /</div>
            <a href="/${username}/${repoName}">${repoName}</a>
        `)
    }

    static _parseDesc = () => {
        let t: string = `
            <p id="repo-desc">
                <span class="no-description text-italic">No Description</span>
                <a class="link" href=""></a>
            </p>
        `
        appendHtml(this.bodyWrapperSel, t)
    }

    static _parseGitStats = () => {
        let t: string = `
            <div class="ui segment" id="git-stats">
                <div class="ui two horizontal center link list">
                    <div class="item">
                        <a href="/haxi/gitWeb/commits/master"><span class="ui text black"><i
                                class="octicon octicon-history"></i> <b>0</b> Commits</span> </a>
                    </div>
                    <div class="item">
                        <a href="/haxi/gitWeb/branches"><span class="ui text black"><i
                                class="octicon octicon-git-branch"></i><b>1</b> Branches</span> </a>
                    </div>
                    <div class="item">
                        <a href="/haxi/gitWeb/releases"><span class="ui text black"><i class="octicon octicon-tag"></i> <b>0</b> Releases</span>
                        </a>
                    </div>
                </div>
            </div>
        `
        appendHtml(this.bodyWrapperSel, t)
    }

    static _parseSecondaryMenu = (path: string, clone_address: string='', displayFileButtons=true) => {
        // 先添加自己，再添加子元素
        this._appendSecondaryMenu()
        // 分支对比栏
        this._appendMenuGitCompare()
        // 分支选择栏
        this._appendMenuGitChoose()
        // 当前目录
        this._appendMenuCurrentDir(path)
        // 新文件栏和克隆栏
        this._appendMenuFileClone(clone_address, displayFileButtons)
    }

    static _appendSecondaryMenu = () => {
        let t: string = `
            <div class="ui secondary menu class-secondary-menu"></div>
        `
        appendHtml(this.bodyWrapperSel, t)
    }

    static _appendMenuGitCompare= () => {
        let secondaryMenuSel: HTMLSelectElement = e(`.class-secondary-menu`)
        let t: string = `
            <div class="fitted item class-git-compare">
                <a href="/haxi/gitWeb/compare/master...master">
                    <button class="ui green small button"><i class="octicon octicon-git-compare"></i></button>
                </a>
            </div>
        `
        appendHtml(secondaryMenuSel, t)
    }

    static _appendMenuGitChoose= () => {
        let secondaryMenuSel: HTMLSelectElement = e(`.class-secondary-menu`)
        let t: string = `
                <div class="fitted item choose reference class-git-choose">
                    <div class="ui floating filter dropdown" data-no-results="No results found." tabindex="0">
                        <div class="ui basic small button">
                            <span class="text">
                                <i class="octicon octicon-git-branch"></i>
                                Branch:
                                <strong>master</strong>
                            </span>
                            <i class="dropdown icon" tabindex="0">
                                <div class="menu" tabindex="-1"></div>
                            </i>
                        </div>
                        <div class="menu" tabindex="-1">
                            <div class="ui icon search input">
                                <i class="filter icon"></i>
                                <input name="search" placeholder="Filter branch or tag...">
                            </div>
                            <div class="header">
                                <div class="ui grid">
                                    <div class="two column row">
                                        <a class="reference column" href="#" data-target="#branch-list">
                                            <span class="text black">
                                                Branches
                                            </span>
                                        </a>
                                        <a class="reference column" href="#" data-target="#tag-list">
                                            <span class="text ">
                                                Tags
                                            </span>
                                        </a>
                                    </div>
                                </div>
                            </div>
                            <div id="branch-list" class="scrolling menu">
                                <div class="item selected" data-url="/haxi/gitWeb/src/master">master</div>
                            </div>
                            <div id="tag-list" class="scrolling menu" style="display: none">
                            </div>
                        </div>
                    </div>
                </div>
        `
        appendHtml(secondaryMenuSel, t)
    }

    static _appendMenuCurrentDir= (path: string) => {
        // 设置主目录
        let repoName: string = path.split('/src')[0].split('/')[2]
        let pathPrefix = path.split('/').splice(0, 5).join('/')
        let t: string = `
            <div class="fitted item class-current-dir">
                <div class="ui breadcrumb class-ui-breadcrumb">
                    <a class="section class-path-section" data-path="${pathPrefix}" data-action="quit">${repoName}</a>
                </div>
            </div>
        `
        let secondaryMenuSel: HTMLSelectElement = e(`.class-secondary-menu`)
        appendHtml(secondaryMenuSel, t)
        // 配置剩下目录
        this._parseFilesPath(path)
    }

    static _parseFilesPath = (path: string) => {
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
                    <span class="section class-path-section">
                    <a data-path="${pathPrefix}" data-action="quit">${p}</a></span>
                `
            }
            appendHtml(sel, t)
        }
    }

    static _appendMenuFileClone= (clone_address: string, displayFileButtons=true) => {
        // 先添加自己，再添加子元素
        this._appendFileClone()
        // 新文件栏
        if (displayFileButtons) {
            this._appendFileButtons()
        }

        if (clone_address.length > 0) {
            // 克隆
            this._appendClonePanel(clone_address)
        }
    }

    static _appendFileClone= () => {
        let secondaryMenuSel: HTMLSelectElement = e(`.class-secondary-menu`)
        let t: string = `
            <div class="right fitted item class-file-clone">
            </div>
        `
        appendHtml(secondaryMenuSel, t)
    }

    static _appendFileButtons= () => {
        let parentSel: HTMLSelectElement = e(`.class-file-clone`)
        let t: string = `
            <div id="file-buttons" class="ui tiny blue buttons">
                <a href="/haxi/gitWeb/_new/master/" class="ui button">
                    New file
                </a>
                <a href="/haxi/gitWeb/_upload/master/" class="ui button">
                    Upload file
                </a>
            </div>
        `
        appendHtml(parentSel, t)
    }

    static _appendClonePanel = (cloneAddress: string) => {
        let parentSel: HTMLSelectElement = e(`.class-file-clone`)
        let t: string = `
            <div class="ui action small input" id="clone-panel">
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
            </div>
        `
        appendHtml(parentSel, t)
    }

    static _appendFilesTable = (entries: [], path: string) => {
        // 先添加自己，再添加子元素
        this._appendRepoFilesTable()
    //    file header，也就是最新 commit
        this._appendFilesTableHead()
    //    文件目录
        this._appendFilesTableBody(entries, path)
    }

    static _appendRepoFilesTable = () => {
        // 先添加自己，再添加子元素
        let t = `
            <table id="repo-files-table" class="ui unstackable fixed single line table"></table>
        `
        appendHtml(this.bodyWrapperSel, t)
    }

    static _appendFilesTableHead = () => {
        let t = `
            <thead>
                <tr>
                    <th class="four wide">
                        <img class="ui avatar image img-12"
                             src="https://secure.gravatar.com/avatar/1ef60960c2a690d14a2abbbf63ab0f86?d=identicon">
                        <a href="/haxi"><strong>haxi</strong></a>
                        <a rel="nofollow" class="ui sha label"
                           href="/haxi/gitWeb/commit/b780a75d2d62d8473df9b0968238e4454245fea1">b780a75d2d</a>
                        <span class="grey has-emoji">Add 'test1.txt'</span>
                    </th>
                    <th class="nine wide">
                    </th>
                    <th class="three wide text grey right age">
                    <span class="time-since poping up" title="" data-content="Sun, 30 Apr 2023 08:03:29 UTC"
                        data-variation="inverted tiny">6 hours ago</span>
                    </th>
                </tr>
            </thead>        
        `
        let parentSel: HTMLSelectElement = e(`#repo-files-table`)
        appendHtml(parentSel, t)
    }

    static _appendFilesTableBody = (entries: [], path: string='') => {
        // 先添加自己，再添加文件目录
        let t: string = `
            <tbody class="class-files-tboody"></tbody>
        `
        let parentSel: HTMLSelectElement = e(`#repo-files-table`)
        appendHtml(parentSel, t)
        //
        this._appendFiles(entries, path)
    }

    static _appendFiles = (entries: [], path: string='') => {
        // 如果当前目录是二级目录，需要添加父目录层
        this._appendFilesParent(path)
        //
        let parentSel: HTMLSelectElement = e(`.class-files-tboody`)
        let pathname: string = window.location.pathname
        // 判断是否有 readme  文件
        let hasReadme: boolean = false
        let readmePath: string
        for (let e of entries) {
            let entry = e as ResponseRepoDetailFile | ResponseRepoDetailDir
            let span: string
            let name = entry.name
            let _path = entry.path
            //
            if (name == "README.md") {
                hasReadme = true
                readmePath = _path
            }
            let hashCode = entry.hash_code
            let commit = entry.commit_message
            let ct = entry.commit_time
            let type = entry.type
            if (type == EnumFileType.dir) {
                span = `
                    <span class="octicon octicon-file-directory"></span>
                `
            } else {
                span = `
                    <span class="octicon octicon-file-text"></span>
                `
            }
            let t: string = `
                <tbody class="class-files-tboody">
                    <tr>
                    <td class="name">
                        ${span}
                        <a class="a-files-path-name" data-path="${pathname}/src/master/${_path}" data-type="${type}" data-action="enter">${name}</a>
                    </td>
                    <td class="message collapsing has-emoji">
                        <a rel="nofollow" class="ui sha label"
                           href="${pathname}/commit/${hashCode}">${hashCode.substring(0, 10)}</a>
                        ${commit}
                    </td>
                    <td class="text grey right age"><span>${ct}</span></td>
                </tr>
                </tbody>
            `
            appendHtml(parentSel, t)
        }
        // 如果是首页并且有 readme
        if (hasReadme) {
            this._parseReadme(readmePath)
        }
    }

    static _appendFilesParent = (path: string) => {
        if (path.split('/').length > 5) {
            let parentSel: HTMLSelectElement = e(`.class-files-tboody`)
            let pathArray = path.split('/')
            let pathParent = pathArray.splice(0, pathArray.length - 1).join('/')
            let t: string = `
                <tr class="has-parent">
                    <td colspan="3">
                    <i class="octicon octicon-mail-reply"></i>
                    <a class="a-files-path-name" data-path="${pathParent}" data-action="enter">..</a></td>
                </tr>
            `
            prependHtml(parentSel, t)
        }
    }

    static _parseReadme = (readmePath: string) => {
        // 获取 readme 文件的内容
        let form = {
            type: EnumFileType.file
        }
        let path = window.location.pathname + `/src/master/${readmePath}`
        let self = this
        APIContainer.repoSuffix(`${path}`, form, function (r) {
            let response = JSON.parse(r)
            log("response:", response.data)
            let res: ResponserRepoSuffix = response.data
            let content: string = res.content
            let t = `
                <div id="file-content" class="tab-size-8">
                    <h4 class="ui top attached header" id="repo-readme">
                        <i class="octicon octicon-book"></i>
                        <strong>README.md</strong>
                    </h4>
                    <div class="ui unstackable attached table segment">
                        <div id="" class="file-view markdown has-emoji">
    
                            <div id="gitweb" class="anchor-wrap"><h1>${content}<a class="anchor" href="#gitweb"><span
                                    class="octicon octicon-link"></span></a></h1></div>
                        </div>
                    </div>
                </div>    
            `
            appendHtml(self.bodyWrapperSel, t)
        })
    }

    static enterSecondaryDir = (entries: [], path: string) => {
        let self = this
        // 清空页面 body-wrapper
        self._clearBodyWrapper()
        // 添加二级菜单，包括分支栏、当前目录栏、新文件栏、克隆栏
        self._parseSecondaryMenu(path)
        // 解析文件，包括最新 commit 栏、文件目录栏、readme.md 栏位
        self._appendFilesTable(entries, path)
    }

//     static bindPathSectionEvent = () => {
//         let self = this
//         let sel = e(`.class-ui-breadcrumb`)
//         sel.addEventListener('click', function(event){
//             let target = event.target as HTMLSelectElement
//             if (target.className.includes("class-path-section")) {
//                 let path: string = target.dataset.path
//                 let type: EnumFileType = EnumFileType.dir
//                 let form = {
//                     type: type
//                 }
//                 // 说明访问的是主路径，不然的话就是调到上面一层目录
//                 if (path.split('/').length == 5) {
//                     self.initRepo()
//                 } else {
//                     APIContainer.repoSuffix(`${path}`, form, function (r) {
//                         let response = JSON.parse(r)
//                         log("response:", response.data)
//                         let res: ResponserRepoSuffix = response.data
//                         self.parseFilesSuffixBody(res.entries, res.path)
//                     })
//                 }
//             }
//         })
//     }
//
    static enterFile = (path: string, content: string) => {
        let self = this
        // 清空页面 body-wrapper
        self._clearBodyWrapper()
        // 添加二级菜单，包括分支栏、当前目录栏、新文件栏、克隆栏
        self._parseSecondaryMenu(path, '', false)
        // 解析文件，包括文件名栏、文件内容
        self._parseFileContent(path, content)
    }

    static _parseFileContent = (path: string, content: string) => {
        // 增加文件名栏
        this._appendFileHeader(path)
        // 填充内容
        this.fillFileContent(content)
    }

    static _appendFileHeader = (path: string) => {
        // 解析内容
        let filename = path.split('/').splice(-1)
        let t: string = `
            <div id="file-content" class="tab-size-8">
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
          </div>
        `
        appendHtml(this.bodyWrapperSel, t)
        //
    }

    static fillFileContent = (content: string) => {
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

class RepoEvent {

    static enter = (target) => {
        log("enter click path --- ", target)
        let path = target.dataset.path
        // 说明访问的是主路径
        if (path.split('/').length == 5) {
            RepoContainer.initRepo()
        } else {
            let type = target.dataset.type
            let form = {
                type: type,
            }
            APIContainer.repoSuffix(`${path}`, form, function (r) {
                let response = JSON.parse(r)
                log("response:", response.data)
                let res: ResponserRepoSuffix = response.data
                if (type === EnumFileType.dir) {
                    // 进入文件二级目录
                    RepoContainer.enterSecondaryDir(res.entries, res.path)
                } else {
                    // 解析文件
                    RepoContainer.enterFile(path, res.content)
                }
            })
        }
    }

    static quit = (target) => {
        log("quit click path --- ", target)
        let path: string = target.dataset.path
        let type: EnumFileType = EnumFileType.dir
        let form = {
            type: type
        }
        // 说明访问的是主路径，不然的话就是调到上面一层目录
        if (path.split('/').length == 5) {
            RepoContainer.initRepo()
        } else {
            APIContainer.repoSuffix(`${path}`, form, function (r) {
                let response = JSON.parse(r)
                log("response:", response.data)
                let res: ResponserRepoSuffix = response.data
                RepoContainer.enterSecondaryDir(res.entries, res.path)
            })
        }
    }
}

class ActionRepo extends Action {
    static eventActions = {
        'click': {
            'enter': RepoEvent.enter,
            'quit': RepoEvent.quit,
        },
    }
}
