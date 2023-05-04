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
    static initRepo = (path: string='') => {
        let self = this
        let username: string
        let repoName: string
        let branchName: string
        if (path.length > 0) {
            let repoPath: RepoPath = self.repoForPath(path)
            username = repoPath.username
            repoName = repoPath.repoName
            branchName = repoPath.branchName
        } else {
            let paths = window.location.pathname.split('/')
            username = paths[1]
            repoName = paths[2]
            branchName = 'master'
        }
        //
        APIContainer.repoDetail(username, repoName, branchName, function (r) {
            let response = JSON.parse(r)
            let responseRepoDetail: ResponseRepoDetail = response.data
            log("responseRepoDetail", responseRepoDetail)
            // 设置左上角用户名和仓库名
            self._parseRepoName(username, repoName)
            // 设置仓库布局类型
            self.parseRepository(responseRepoDetail.entries.length)

            if (responseRepoDetail.entries.length > 0) {
                // 清空页面 body-wrapper
                self._clearBodyWrapper()
                // 添加描述栏
                self._parseDesc()
                // 添加 commits 栏
                self._parseGitStats(responseRepoDetail.path, responseRepoDetail.commits_branches)
                // 添加二级菜单，包括分支栏、当前目录栏、新文件栏、克隆栏
                let paramsParseSecondaryMenu: ParamsParseSecondaryMenu = {
                    path: responseRepoDetail.path,
                    commits_branches: responseRepoDetail.commits_branches,
                    clone_address: responseRepoDetail.clone_address,
                }
                self._parseSecondaryMenu(paramsParseSecondaryMenu)
                // 解析文件，包括最新 commit 栏、文件目录栏、readme.md 栏位
                self._appendFilesTable(
                    responseRepoDetail.entries,
                    responseRepoDetail.path,
                    responseRepoDetail.latest_commit,
                    )
            } else {
            //    说明是空仓库
                self.initEmptyRepo(responseRepoDetail.clone_address)
            }
        })
    }

    static repoForPath = (path: string) :RepoPath => {
        let arg: string = path.split('/')[3]
        let path_list = path.split(`/${arg}`)
        let prefix: string[] = path_list[0].split('/')
        let username = prefix[1]
        let repoName = prefix[2]
        let suffix_list: string[] = path_list[1].split('/')
        let branchName = suffix_list[1]
        let form: RepoPath = {
            username: username,
            repoName: repoName,
            branchName: branchName
        }
        return form
    }

    static parseRepository = (length) => {
        let repositorySel = e(`.repository`)
        if (length > 0) {
            repositorySel.className = 'repository file list'
        } else {
            repositorySel.className = 'repository quickstart'
        }
    }

    static initEmptyRepo = (clone_address: string) => {
        let t: string = `
            <div class="ui grid">
                <div class="sixteen wide column content">
                    <h4 class="ui top attached header">
                        Quick Guide
                    </h4>
                    <div class="ui attached guide table segment">
                        <div class="item">
                            <h3>Clone this repository 
                                <small>Need help cloning? Visit 
                                    <a href="http://git-scm.com/book/en/Git-Basics-Getting-a-Git-Repository" rel="nofollow">
                                    Help
                                    </a>
                                    !
                                </small>
                            </h3>
                            <div class="ui action small input">
                                <button class="ui basic clone button blue" id="repo-clone-https" data-link="${clone_address}">
                                    HTTPS
                                </button>
                                <button class="ui basic clone button" id="repo-clone-ssh" data-link="">
                                    SSH
                                </button>
                                <input id="repo-clone-url" value="${clone_address}" readonly="">
                                <button class="ui basic button poping up clipboard" id="clipboard-btn" data-original="Copy" data-success="Copied!" data-error="Press ⌘-C or Ctrl-C to copy" data-content="Copy" data-variation="inverted tiny" data-clipboard-target="#repo-clone-url">
                                    <i class="octicon octicon-clippy"></i>
                                </button>
                            </div>
                        </div>
                        <div class="ui divider"></div>
                        <div class="item">
                            <h3>Create a new repository on the command line</h3>
                            <div class="markdown">
                                <pre>
                                    <code>touch README.md
                                        git init
                                        git add README.md
                                        git commit -m "first commit"
                                        git remote add origin 
                                        <span class="clone-url">${clone_address}</span>
                                        git push -u origin master
                                    </code>
                                </pre>
                            </div>
                        </div>
                        <div class="ui divider"></div>
                        <div class="item">
                            <h3>Push an existing repository from the command line</h3>
                            <div class="markdown">
                            <pre>
                                <code>git remote add origin 
                                    <span class="clone-url">${clone_address}</span>
                                    git push -u origin master
                                </code>
                            </pre>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `
        // let girdSel: HTMLSelectElement = e(`.grid`)
        appendHtml(this.bodyWrapperSel, t)
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

    static _parseGitStats = (path, commitsBranches: CommitsBranches) => {
        let repoPath: RepoPath = this.repoForPath(path)
        let username: string = repoPath.username
        let repoName: string = repoPath.repoName
        let branchName: string = repoPath.branchName

        let t: string = `
            <div class="ui segment" id="git-stats">
                <div class="ui two horizontal center link list">
                    <div class="item">
                        <a><span class="ui text black" data-path="/${username}/${repoName}/commits/${branchName}" data-action="commits">
                        <i class="octicon octicon-history"></i> <b>${commitsBranches.commit_num}</b> Commits</span> </a>
                    </div>
                    <div class="item">
                        <a><span class="ui text black" data-path="/${username}/${repoName}/branches" data-action="branches">
                        <i class="octicon octicon-git-branch"></i><b>${commitsBranches.branch_num }</b> Branches</span> </a>
                    </div>
                    <div class="item">
                        <a><span class="ui text black" data-path="/${username}/${repoName}/releases" data-action="releases">
                        <i class="octicon octicon-tag"></i> <b>0</b> Releases</span>
                        </a>
                    </div>
                </div>
            </div>
        `
        appendHtml(this.bodyWrapperSel, t)
    }

    static _parseSecondaryMenu = (
        params: ParamsParseSecondaryMenu
    ) => {
        // 先添加自己，再添加子元素
        this._appendSecondaryMenu()
        // 分支对比栏
        this._appendMenuGitCompare(params.path)
        // 分支选择栏
        this._appendMenuGitChoose(params.path, params.commits_branches)
        // 当前目录
        this._appendMenuCurrentDir(params.path)
        // 新文件栏和克隆栏
        this._appendMenuFileClone(params.path, params.clone_address, params.displayFileButtons)
    }

    static _appendSecondaryMenu = () => {
        let t: string = `
            <div class="ui secondary menu class-secondary-menu"></div>
        `
        appendHtml(this.bodyWrapperSel, t)
    }

    static _appendMenuGitCompare= (path: string) => {
        let repoPath: RepoPath = this.repoForPath(path)
        let username: string = repoPath.username
        let repoName: string = repoPath.repoName
        let secondaryMenuSel: HTMLSelectElement = e(`.class-secondary-menu`)
        let t: string = `
            <div class="fitted item class-git-compare">
                <a href="/${username}/${repoName}/compare/master...master">
                    <button class="ui green small button"><i class="octicon octicon-git-compare"></i></button>
                </a>
            </div>
        `
        appendHtml(secondaryMenuSel, t)
    }

    static _appendMenuGitChoose= (path: string, commits_branches: CommitsBranches) => {
        let repoPath: RepoPath = this.repoForPath(path)
        let username: string = repoPath.username
        let repoName: string = repoPath.repoName
        let branchName: string = repoPath.branchName

        let arg: string = path.split('/')[3]
        let pathList: string[] = path.split(`/${arg}/${branchName}`)
        let pathSuffix: string = pathList[pathList.length - 1]
        let type: string
        let pathSuffixList: string[] = pathSuffix.split('/')
        if (pathSuffixList[pathSuffixList.length - 1].includes('.')) {
            type = EnumFileType.file
        } else {
            type = EnumFileType.dir
        }

        let secondaryMenuSel: HTMLSelectElement = e(`.class-secondary-menu`)
        let branchListTemplate: string = ``
        for (let branch of commits_branches.branch_list) {
            let bt: string
            if (branch == commits_branches.current_branch) {
                bt = `
                    <div class="item selected" data-path="/${username}/${repoName}/${arg}/${branch}${pathSuffix}" data-type="${type}" data-action="checkout">${branch}</div>
                `
            } else {
                bt = `
                    <div class="item" data-path="/${username}/${repoName}/${arg}/${branch}${pathSuffix}" data-type="${type}" data-action="checkout">${branch}</div>
                `
            }
            branchListTemplate += bt
        }

        let t: string = `
                <div class="fitted item choose reference class-git-choose">
                    <div class="ui floating filter dropdown class-floating-filter-dropdown" data-no-results="No results found." tabindex="0">
                        <div class="ui basic small button" data-action="visible">
                            <span class="text">
                                <i class="octicon octicon-git-branch"></i>
                                Branch:
                                <strong>${commits_branches.current_branch}</strong>
                            </span>
                            <i class="dropdown icon" tabindex="0">
                                <div class="menu" tabindex="-1"></div>
                            </i>
                        </div>
                        <div class="menu class-floating-menu" tabindex="-1">
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
                                ${branchListTemplate}
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
        let repoPath: RepoPath = this.repoForPath(path)
        let repoName: string = repoPath.repoName
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

    static _appendMenuFileClone= (path: string, clone_address: string, displayFileButtons=true) => {
        // 先添加自己，再添加子元素
        this._appendFileClone()
        // 新文件栏
        if (displayFileButtons) {
            this._appendFileButtons(path)
        }

        if (clone_address) {
            // 克隆
            this._appendClonePanel(clone_address, path)
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

    static _appendFileButtons= (path: string) => {
        let repoPath: RepoPath = this.repoForPath(path)
        let username: string = repoPath.username
        let repoName: string = repoPath.repoName
        let branchName: string = repoPath.branchName
        let parentSel: HTMLSelectElement = e(`.class-file-clone`)
        let t: string = `
            <div id="file-buttons" class="ui tiny blue buttons">
                <a href="/${username}/${repoName}/_new/${branchName}/" class="ui button">
                    New file
                </a>
                <a href="/${username}/${repoName}/_upload/${branchName}/" class="ui button">
                    Upload file
                </a>
            </div>
        `
        appendHtml(parentSel, t)
    }

    static _appendClonePanel = (cloneAddress: string, path: string) => {
        let repoPath: RepoPath = this.repoForPath(path)
        let username: string = repoPath.username
        let repoName: string = repoPath.repoName
        let branchName: string = repoPath.branchName
        let parentSel: HTMLSelectElement = e(`.class-file-clone`)
        let t: string = `
            <div class="ui action small input" id="clone-panel">
                <button class="ui basic clone button blue" id="repo-clone-https" data-link="${cloneAddress}">
                                HTTPS
                </button>
                <button class="ui basic clone button" id="repo-clone-ssh" data-link="">
                    SSH
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
                        <a class="item" href="/${username}/${repoName}/archive/${branchName}.zip"><i
                                class="octicon octicon-file-zip"></i> ZIP</a>
                        <a class="item" href="/${username}/${repoName}/archive/${branchName}.tar.gz"><i
                                class="octicon octicon-file-zip"></i> TAR.GZ</a>
                    </div>
                </div>
            </div>
        `
        appendHtml(parentSel, t)
    }

    static _appendFilesTable = (entries: [], path: string, latest_commit: LatestCommitItem) => {
        // 先添加自己，再添加子元素
        this._appendRepoFilesTable()
    //    file header，也就是最新 commit
        this._appendFilesTableHead(latest_commit, path)
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

    static _appendFilesTableHead = (latest_commit: LatestCommitItem, path: string) => {
        let repoPath: RepoPath = this.repoForPath(path)
        let username: string = repoPath.username
        let repoName: string = repoPath.repoName
        let author: string = latest_commit.author
        let hash_code: string = latest_commit.hash_code
        let hash: string = latest_commit.hash_code.substring(0, 10)
        let commit_message: string = latest_commit.commit_message
        let commit_time: string = latest_commit.commit_time
        let t = `
            <thead>
                <tr>
                    <th class="four wide">
                        <img class="ui avatar image img-12"
                             src="https://secure.gravatar.com/avatar/1ef60960c2a690d14a2abbbf63ab0f86?d=identicon">
                        <strong>${author}</strong>
                        <a rel="nofollow" class="ui sha label"
                           href="/${username}/${repoName}/commit/${hash_code}">${hash}</a>
                        <span class="grey has-emoji">${commit_message}</span>
                    </th>
                    <th class="nine wide">
                    </th>
                    <th class="three wide text grey right age">
                    <span class="time-since poping up" title="" data-content="Sun, 30 Apr 2023 08:03:29 UTC"
                        data-variation="inverted tiny">${commit_time}</span>
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
        // let pathname: string = window.location.pathname
        let repoPath: RepoPath = this.repoForPath(path)
        let username: string = repoPath.username
        let repoName: string = repoPath.repoName
        let branchName: string = repoPath.branchName
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
                        <a class="a-files-path-name" data-path="/${username}/${repoName}/src/${branchName}/${_path}" data-type="${type}" data-action="enter">${name}</a>
                    </td>
                    <td class="message collapsing has-emoji">
                        <a rel="nofollow" class="ui sha label"
                           href="/${username}/${repoName}/commit/${hashCode}">${hashCode.substring(0, 10)}</a>
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
            this._parseReadme(path, readmePath)
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

    static _parseReadme = (path: string, readmePath: string) => {
        // 获取 readme 文件的内容
        let form = {
            type: EnumFileType.file
        }
        let repoPath: RepoPath = this.repoForPath(path)
        let username: string = repoPath.username
        let repoName: string = repoPath.repoName
        let branchName: string = repoPath.branchName
        let p = `/${username}/${repoName}/src/${branchName}/${readmePath}`
        let self = this
        APIContainer.repoSuffix(`${p}`, form, function (r) {
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
    
                            <div id="${repoName}" class="anchor-wrap"><h1>${content}<a class="anchor" href="/${username}/${repoName}"><span
                                    class="octicon octicon-link"></span></a></h1></div>
                        </div>
                    </div>
                </div>    
            `
            appendHtml(self.bodyWrapperSel, t)
        })
    }

    static enterSecondaryDir = (params: ParamsEnterSecondaryDir) => {
        let self = this
        // 清空页面 body-wrapper
        self._clearBodyWrapper()
        // 添加二级菜单，包括分支栏、当前目录栏、新文件栏、克隆栏
        let p: ParamsParseSecondaryMenu = {
            path: params.path,
            commits_branches: params.commits_branches,
        }
        self._parseSecondaryMenu(p)
        // 解析文件，包括最新 commit 栏、文件目录栏、readme.md 栏位
        self._appendFilesTable(params.entries, params.path, params.latest_commit)
    }

    static enterFile = (params: ParamsEnterFile) => {
        let self = this
        // 清空页面 body-wrapper
        self._clearBodyWrapper()
        // 添加二级菜单，包括分支栏、当前目录栏、新文件栏、克隆栏
        let paramsParseSecondaryMenu: ParamsParseSecondaryMenu = {
            path: params.path,
            commits_branches: params.commits_branches,
            displayFileButtons: false,
        }
        self._parseSecondaryMenu(paramsParseSecondaryMenu)
        // 解析文件，包括文件名栏、文件内容
        self._parseFileContent(params.path, params.content)
    }

    static _parseFileContent = (path: string, content: string) => {
        // 增加文件名栏
        this._appendFileHeader(path)
        // 填充内容
        this.fillFileContent(content)
    }

    static _appendFileHeader = (path: string) => {
        let repoPath: RepoPath = this.repoForPath(path)
        let username: string = repoPath.username
        let repoName: string = repoPath.repoName
        let branchName: string = repoPath.branchName
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
                            <a class="ui button" href="/${username}/${repoName}/src/a61c249028cd1120582f506a68bf8fecc6a3b099/${filename}">Permalink</a>
                            <a class="ui button" href="/${username}/${repoName}/commits/${branchName}/${filename}">History</a>
                            <a class="ui button" href="/${username}/${repoName}/raw/${branchName}/${filename}">Raw</a>
                        </div>
                        <a href="/${username}/${repoName}/_edit/${branchName}/${filename}"><i class="octicon octicon-pencil btn-octicon poping up" data-content="Edit this file" data-position="bottom center" data-variation="tiny inverted"></i></a>
                        <a href="/${username}/${repoName}/_delete/${branchName}/${filename}"><i class="octicon octicon-trashcan btn-octicon btn-octicon-danger poping up" data-content="Delete this file" data-position="bottom center" data-variation="tiny inverted"></i></a>
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

    // 进入 commits
    static initCommits = (target) => {
        let self = this
        let path = target.dataset.path
        APIContainer.repoCommits(path, function (r) {
            let response = JSON.parse(r)
            let responseRepoCommits: ResponseRepoCommits = response.data
            log("responseRepoCommits", responseRepoCommits)
            // 清空页面 body-wrapper
            self._clearBodyWrapper()
            // 添加二级菜单，包括分支栏
            let paramsParseSecondaryMenu: ParamsParseSecondaryMenu = {
                path: path,
                commits_branches: responseRepoCommits.commits_branches,
            }
            self._parseCommitsSecondaryMenu(paramsParseSecondaryMenu)
            // 添加commit
            self._parseCommitsTable(path, responseRepoCommits.commit_list)
        })
    }

    static _parseCommitsSecondaryMenu = (
        params: ParamsParseSecondaryMenu
    ) => {
        // 先添加自己，再添加子元素
        this._appendSecondaryMenu()
        // 分支选择栏
        this._appendMenuGitChoose(params.path, params.commits_branches)
        this._appendCommitHeader(params.path)
    }

    static _appendCommitHeader = (path: string) => {
        let repoPath: RepoPath = this.repoForPath(path)
        let username: string = repoPath.username
        let repoName: string = repoPath.repoName
        let branchName: string = repoPath.branchName
        let arg: string = path.split('/')[3]
        let t = `
            <h4 class="ui top attached header">
                Commit History
                <div class="ui right">
                <form action="/${username}/${repoName}/${arg}/${branchName}/search">
                    <div class="ui tiny search input">
                        <input name="q" placeholder="Search commits" value="" autofocus="">
                    </div>
                <button class="ui black tiny button" data-panel="#add-deploy-key-panel">Find</button>
                </form>
                </div>
        
            </h4>
        `
        appendHtml(this.bodyWrapperSel, t)
    }

    static _parseCommitsTable = (path: string, commit_list: LatestCommitItem[]) => {
        let repoPath: RepoPath = this.repoForPath(path)
        let username: string = repoPath.username
        let repoName: string = repoPath.repoName
        let branchName: string = repoPath.branchName
        let arg: string = path.split('/')[3]
        let tr: string = ``
        for (let item of commit_list) {
            tr += `
                <tr>
                    <td class="author">
                        <img class="ui avatar image" src="https://secure.gravatar.com/avatar/9477f6251d8aa33b64fb64f6a7c377d0?d=identicon" alt="">
                        ${item.author}
                    </td>
                    <td class="message collapsing">
                        <a rel="nofollow" class="ui sha label" data-path="/${username}/${repoName}/${arg}/${item.hash_code}">
                        ${item.hash_code.substring(0, 10)}
                        </a>
                        <span class=" has-emoji">${item.commit_message}</span>
                    </td>
                    <td class="grey text right aligned">
                        <span class="time-since poping up" title="" data-content="Mon, 01 May 2023 15:11:03 UTC" data-variation="inverted tiny">
                        ${item.commit_time}
                        </span>
                    </td>
                </tr>
            `
        }
        let t = `
            <div class="ui unstackable attached table segment">
            <table id="commits-table" class="ui unstackable very basic striped fixed table single line">
                <thead>
                    <tr>
                        <th class="four wide">Author</th>
                        <th class="nine wide message"><span class="sha">SHA1</span> Message</th>
                        <th class="three wide right aligned">Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${tr}
                </tbody>
            </table>
            </div>
        `
        appendHtml(this.bodyWrapperSel, t)
    }

}

class RepoEvent {

    static enter = (target) => {
        log("enter click path --- ", target)
        let path = target.dataset.path
        // 说明访问的是主路径
        if (path.split('/').length == 5) {
            RepoContainer.initRepo(path)
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
                    let params: ParamsEnterSecondaryDir = {
                        entries: res.entries,
                        path: res.path,
                        latest_commit: res.latest_commit,
                        commits_branches: res.commits_branches,
                    }
                    RepoContainer.enterSecondaryDir(params)
                } else {
                    // 解析文件
                    let params: ParamsEnterFile = {
                        path: path,
                        content: res.content,
                        commits_branches: res.commits_branches,
                    }
                    RepoContainer.enterFile(params)
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
            RepoContainer.initRepo(path)
        } else {
            APIContainer.repoSuffix(`${path}`, form, function (r) {
                let response = JSON.parse(r)
                log("response:", response.data)
                let res: ResponserRepoSuffix = response.data
                // 进入文件二级目录
                    let params: ParamsEnterSecondaryDir = {
                        entries: res.entries,
                        path: res.path,
                        latest_commit: res.latest_commit,
                        commits_branches: res.commits_branches
                    }
                RepoContainer.enterSecondaryDir(params)
            })
        }
    }

    // 监听浮动选择器
    static visible = () => {
        //
        let floatingBranchSel: HTMLSelectElement = e(`.class-floating-filter-dropdown`)
        floatingBranchSel.className += ' active visible'
        //
        let menuBranchSel: HTMLSelectElement = e(`.class-floating-menu`)
        menuBranchSel.className += ' transition visible'
        menuBranchSel.style.display = 'block !important'
        // 设置 body 的 dataset 为 visible 状态，开始统计点击 visible 状态
        // let chooseSel = e(`body`)
        // chooseSel.dataset.visible = "0"
        //
    }

    // 监听浮动选择器
    static checkout = (target) => {
        this.enter(target)
    }

    // 监听点击事件，假设这时候有浮动的过滤器展开了，设置为关闭
    static bindClick = () => {
        // bindEvent('body', 'click', function (event) {
        //     let bodySel = e('body')
        //     // 之所以多这一步设置为 "1" 的状态，是因为这一次监听点击跟上面的监听 visible 点击是同步发生的，所以需要多走一步
        //     if (bodySel.dataset.visible == '0') {
        //         bodySel.dataset.visible = "1"
        //
        //     } else if (e('body').dataset.visible == '1') {
        //         // visible 设置为 -1
        //         bodySel.dataset.visible = "-1"
        //         // 关闭浮动器
        //         let floatingBranchSel: HTMLSelectElement = e(`.class-floating-filter-dropdown`)
        //         let floatingBranchClassNames: string[] = floatingBranchSel.className.split(' ')
        //         floatingBranchSel.className = floatingBranchClassNames.splice(0, floatingBranchClassNames.length - 2).join(' ')
        //         //
        //         let menuBranchSel: HTMLSelectElement = e(`.class-floating-menu`)
        //         let menuBranchSelClassNames = menuBranchSel.className.split(' ')
        //         menuBranchSel.className = menuBranchSelClassNames.splice(0, menuBranchSelClassNames.length - 2).join(' ')
        //         menuBranchSel.style.display = 'none'
        //     }
        // })
    }
}

class ActionRepo extends Action {
    static eventActions = {
        'click': {
            'enter': RepoEvent.enter,
            'quit': RepoEvent.quit,
            'visible': RepoEvent.visible,
            'checkout': RepoEvent.checkout,
            'commits': RepoContainer.initCommits,
        },
    }
}
