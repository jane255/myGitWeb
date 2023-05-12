class RepoContainer {
    static bodyWrapperSel: HTMLSelectElement = e(`.body-wrapper`)

    // -------- 首页初始化仓库列表
    static initRepoList = () => {
        let self = this
        let username = window.location.pathname.substring(1)
        let usernameSel = e(`.class-username`)
        usernameSel.innerText = username
        //
        APIContainer.repoList(function (r) {
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

    // -------- 初始化仓库详情
    static initRepo = (path: string='') => {
        let self = this
        //
        let repoPath: RepoPath = this.repoForPath(path)
        let username = repoPath.username
        let repoName = repoPath.repoName
        let url = repoPath.path
        //
        APIContainer.repoTarget(url, function (r) {
            let response = JSON.parse(r)
            let responseRepoDetail: ResponseRepoDetail = response.data
            log("responseRepoDetail", responseRepoDetail)
            // 设置左上角用户名和仓库名
            self._parseRepoName(username, repoName)
            // 设置仓库布局类型
            self.parseRepository(responseRepoDetail.entries.length)
            // 假设仓库有文件夹
            if (responseRepoDetail.entries.length > 0) {
                // 清空页面 body-wrapper
                self._clearBodyWrapper()
                // 添加描述栏
                self._parseDesc()
                // 添加 commits 栏
                self._parseGitStats(repoPath, responseRepoDetail.repo_stats)
                // 添加二级菜单，包括分支栏、当前目录栏、新文件栏、克隆栏
                let paramsParseSecondaryMenu: ParamsParseSecondaryMenu = {
                    repoPath: repoPath,
                    repoOverview: responseRepoDetail.repo_overview,
                }
                self._parseSecondaryMenu(paramsParseSecondaryMenu)
                // 解析文件，包括最新 commit 栏、文件目录栏、readme.md 栏位
                self._appendFilesTable(
                    responseRepoDetail.entries,
                    repoPath,
                    responseRepoDetail.latest_commit,
                    )
            } else {
            //    说明是空仓库
                self.initEmptyRepo(responseRepoDetail.repo_overview)
            }
        })
    }

    static repoForPath = (path: string) :RepoPath => {
        if (path.length === 0) {
            let pathnameList: string[] = window.location.pathname.split('/')
            path = `/${pathnameList[1]}/${pathnameList[2]}/src?checkoutType=branch&checkoutName=master`
        }
        // 切割路由和参数
        let pathList: string[]
        if (path.includes('?')) {
            pathList = path.split('?')
        } else {
            pathList = [path]
        }
        //
        let prefix: string[] = pathList[0].split('/')
        let username = prefix[1]
        let repoName = prefix[2]
        let target = prefix[3]
        //
        let checkoutName: string = ``
        let checkoutType: string = ``
        let suffix: string
        let suffixType: string
        if (path.includes('?')) {
            for (let ele of pathList[1].split('&')) {
                let param: string[] = ele.split('=')
                let key: string = param[0]
                let value: string = param[1]
                if (key === 'checkoutName') {
                    checkoutName = value
                } else if (key === 'checkoutType') {
                    checkoutType = value
                } else if (key === 'suffix') {
                    suffix = value
                } else if (key === 'suffixType') {
                    suffixType = value
                }
            }
        }

        path = `/${username}/${repoName}/${target}?checkoutType=${checkoutType}&checkoutName=${checkoutName}`
        let repo: RepoPath = {
            username: username,
            repoName: repoName,
            target: target,
            checkoutName: checkoutName.length > 0 ? checkoutName : 'master',
            checkoutType: checkoutType.length > 0 ? checkoutType : EnumCheckoutType.branch,
            path: path,
        }
        if (suffix != null) {
            repo.suffix = suffix
            repo.suffixType = suffixType
        }
        return repo
    }

    static pathForRepo = (repoPath: RepoPath) :string => {
        let username: string = repoPath.username
        let repoName: string = repoPath.repoName
        let target: string = repoPath.target
        let checkoutName: string = repoPath.checkoutName
        let checkoutType: string = repoPath.checkoutType
        let path = `/${username}/${repoName}/${target}?checkoutType=${checkoutType}&checkoutName=${checkoutName}`
        if (repoPath.suffix !== undefined) {
            path += `&suffix=${repoPath.suffix}`
        }
        if (repoPath.suffixType !== undefined) {
            path += `&suffixType=${repoPath.suffixType}`
        }
        return path
    }

    static parseRepository = (length) => {
        let repositorySel = e(`.repository`)
        if (length > 0) {
            repositorySel.className = 'repository file list'
        } else {
            repositorySel.className = 'repository quickstart'
        }
    }

    static initEmptyRepo = (repoOverview: RepoOverview) => {
        let clone_address: string = repoOverview.clone_address
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

    static _parseGitStats = (repoPath: RepoPath, commitsBranches: RepoStats) => {
        let username: string = repoPath.username
        let repoName: string = repoPath.repoName
        let checkoutName: string = repoPath.checkoutName
        let checkoutType: string = repoPath.checkoutType

        let t: string = `
            <div class="ui segment" id="git-stats">
                <div class="ui two horizontal center link list">
                    <div class="item">
                        <a><span class="ui text black" data-path="/${username}/${repoName}/commits?checkoutName=${checkoutName}&checkoutType=${checkoutType}" data-action="commits">
                        <i class="octicon octicon-history"></i> <b>${commitsBranches.commits}</b> Commits</span> </a>
                    </div>
                    <div class="item">
                        <a><span class="ui text black" data-path="/${username}/${repoName}/branches/overview" data-action="branches">
                        <i class="octicon octicon-git-branch"></i><b>${commitsBranches.branches }</b> Branches</span> </a>
                    </div>
                    <div class="item">
                        <a><span class="ui text black" data-path="/${username}/${repoName}/releases" data-action="releases">
                        <i class="octicon octicon-tag"></i> <b>${commitsBranches.releases }</b> Releases</span>
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
        this._appendMenuGitCompare(params.repoPath)
        // 分支选择栏
        this._appendMenuGitChoose(params.repoPath, params.repoOverview)
        // 当前目录
        this._appendMenuCurrentDir(params.repoPath)
        // 新文件栏和克隆栏
        this._appendMenuFileClone(params.repoPath, params.repoOverview, params.displayFileButtons)
    }

    static _appendSecondaryMenu = () => {
        let t: string = `
            <div class="ui secondary menu class-secondary-menu"></div>
        `
        appendHtml(this.bodyWrapperSel, t)
    }

    static _appendMenuGitCompare= (repoPath: RepoPath) => {
        let username: string = repoPath.username
        let repoName: string = repoPath.repoName
        let checkoutName: string = repoPath.checkoutName
        let secondaryMenuSel: HTMLSelectElement = e(`.class-secondary-menu`)
        let t: string = `
            <div class="fitted item class-git-compare">
                <a href="/${username}/${repoName}/compare/master...${checkoutName}">
                    <button class="ui green small button"><i class="octicon octicon-git-compare"></i></button>
                </a>
            </div>
        `
        appendHtml(secondaryMenuSel, t)
    }

    static _appendMenuGitChoose= (repoPath: RepoPath, repoOverview: RepoOverview) => {
        // let username: string = repoPath.username
        // let repoName: string = repoPath.repoName
        // let checkoutName: string = repoPath.checkoutName
        //
        // let path = repoPath.path
        // let arg: string = path.split('/')[3]
        // // let pathList: string[] = path.split(`/${arg}/${checkoutName}`)
        // // let pathSuffix: string = pathList[pathList.length - 1]
        // // let type: string
        // // let pathSuffixList: string[] = pathSuffix.split('/')
        // // if (pathSuffixList[pathSuffixList.length - 1].includes('.')) {
        // //     type = EnumFileType.file
        // // } else {
        // //     type = EnumFileType.dir
        // // }
        let self = this
        let secondaryMenuSel: HTMLSelectElement = e(`.class-secondary-menu`)

        // add current
        let currentText: string
        if (repoOverview.current_checkout_type == EnumCheckoutType.branch) {
            currentText = `
                <span class="text">
                    <i class="octicon octicon-git-branch"></i>
                    Branch:
                    <strong>${repoOverview.current_checkout_name}</strong>
                </span>
            `
        } else {
            currentText = `
                <span class="text">
                    <i class="octicon octicon-git-branch"></i>
                    Tree:
                    <strong>${repoOverview.current_checkout_name}</span>
            `
        }
        // add branch list
        let branchListTemplate: string = ``
        for (let branch of repoOverview.branch_list) {
            let bt: string
            let r = {...repoPath}
            r.checkoutType = EnumCheckoutType.branch
            r.checkoutName = branch
            let dataPath: string = self.pathForRepo(r)
            if (branch == repoOverview.current_checkout_name) {
                bt = `
                    <div class="item selected" data-path="${dataPath}" data-action="checkout">${branch}</div>
                `
            } else {
                bt = `
                    <div class="item" data-path="${dataPath}" data-action="checkout">${branch}</div>
                `
            }
            branchListTemplate += bt
        }
        // add tags list
        let tagListTemplate: string = ``
        for (let tag of repoOverview.tag_list) {
            let tt = ``
            let r = {...repoPath}
            r.checkoutType = EnumCheckoutType.tag
            r.checkoutName = tag
            let dataPath: string = self.pathForRepo(r)
            if (tag == repoOverview.current_checkout_name) {
                tt = `
                    <div class="item selected" data-path="${dataPath}" data-action="checkout">${tag}</div>
                `
            } else {
                tt = `
                    <div class="item" data-path="${dataPath}" data-action="checkout">${tag}</div>
                `
            }
            tagListTemplate += tt
        }

        let t: string = `
                <div class="fitted item choose reference class-git-choose">
                    <div class="ui floating filter dropdown class-floating-filter-dropdown" data-no-results="No results found." tabindex="0">
                        <div class="ui basic small button" data-action="visible">
                            <span class="text">
                                ${currentText}
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
                                            <span class="text class-checkout-text-branch" data-action="scrolling">
                                                Branches
                                            </span>
                                        </a>
                                        <a class="reference column" href="#" data-target="#tag-list">
                                            <span class="text class-checkout-text-tag" data-action="scrolling">
                                                Tags
                                            </span>
                                        </a>
                                    </div>
                                </div>
                            </div>
                            <div id="branch-list" class="scrolling menu">
                                ${branchListTemplate}
                            </div>
                            <div id="tag-list" class="scrolling menu">
                                ${tagListTemplate}
                            </div>
                        </div>
                    </div>
                </div>
        `
        appendHtml(secondaryMenuSel, t)
        // 设置隐藏
        let tagListSel = e(`#tag-list`)
        let branchListSel = e(`#branch-list`)
        if (repoOverview.current_checkout_type == EnumCheckoutType.branch) {
            tagListSel.style.display = 'none'
            branchListSel.style.display = 'block'
            let sel = e(`.class-checkout-text-branch`)
            sel.className += ' black'
        } else {
            branchListSel.style.display = 'none'
            tagListSel.style.display = 'block'
            let sel = e(`.class-checkout-text-tag`)
            sel.className += ' black'
        }
    }

    static _appendMenuCurrentDir= (repoPath: RepoPath) => {
        // 设置主目录
        let repoName: string = repoPath.repoName
        let path: string = repoPath.path
        let t: string = `
            <div class="fitted item class-current-dir">
                <div class="ui breadcrumb class-ui-breadcrumb">
                    <a class="section class-path-section" data-path="${path}" data-action="quit">${repoName}</a>
                </div>
            </div>
        `
        let secondaryMenuSel: HTMLSelectElement = e(`.class-secondary-menu`)
        appendHtml(secondaryMenuSel, t)
        // 配置剩下目录
        this._parseFilesPath(repoPath)
    }

    static _parseFilesPath = (repoPath: RepoPath) => {
        let self = this
        if (repoPath.suffix !== undefined) {
            let pathSuffixList: string[] = repoPath.suffix.split('/')
            let length: number = pathSuffixList.length
            let sel: HTMLSelectElement = e(`.class-ui-breadcrumb`)
            let suffix: string = ``
            for (let i = 0; i < length; i++) {
                let t: string
                let p: string = pathSuffixList[i]
                suffix += `/${p}`
                let r: RepoPath = repoPath
                r.suffix = suffix
                let dataPath = self.pathForRepo(r)
                if (i + 1 == length) {
                    t = `
                        <div class="divider"> / </div>
                        <span class="active section class-path-section">${p}</span>
                    `
                } else {
                    t = `
                        <div class="divider"> / </div>
                        <span class="section class-path-section">
                        <a data-path="${dataPath}" data-action="quit">${p}</a></span>
                    `
                }
                appendHtml(sel, t)
            }
        }
    }

    static _appendMenuFileClone= (repoPath: RepoPath, repoOverview: RepoOverview, displayFileButtons=true) => {
        // 先添加自己，再添加子元素
        this._appendFileClone()
        // 新文件栏
        if (displayFileButtons) {
            this._appendFileButtons(repoPath)
        }

        if (repoOverview.clone_address) {
            // 克隆
            this._appendClonePanel(repoPath, repoOverview)
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

    static _appendFileButtons= (repoPath: RepoPath) => {
        let username: string = repoPath.username
        let repoName: string = repoPath.repoName
        let checkoutName: string = repoPath.checkoutName
        let parentSel: HTMLSelectElement = e(`.class-file-clone`)
        let t: string = `
            <div id="file-buttons" class="ui tiny blue buttons">
                <a href="/${username}/${repoName}/_new/${checkoutName}/" class="ui button">
                    New file
                </a>
                <a href="/${username}/${repoName}/_upload/${checkoutName}/" class="ui button">
                    Upload file
                </a>
            </div>
        `
        appendHtml(parentSel, t)
    }

    static _appendClonePanel = (repoPath: RepoPath, repoOverview: RepoOverview) => {
        let username: string = repoPath.username
        let repoName: string = repoPath.repoName
        let checkoutName: string = repoPath.checkoutName
        let cloneAddress: string = repoOverview.clone_address
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
                        <a class="item" href="/${username}/${repoName}/archive/${checkoutName}.zip"><i
                                class="octicon octicon-file-zip"></i> ZIP</a>
                        <a class="item" href="/${username}/${repoName}/archive/${checkoutName}.tar.gz"><i
                                class="octicon octicon-file-zip"></i> TAR.GZ</a>
                    </div>
                </div>
            </div>
        `
        appendHtml(parentSel, t)
    }

    static _appendFilesTable = (entries: [], repoPath: RepoPath, latest_commit: LatestCommitItem) => {
        // 先添加自己，再添加子元素
        this._appendRepoFilesTable()
    //    file header，也就是最新 commit
        this._appendFilesTableHead(latest_commit, repoPath)
    //    文件目录
        this._appendFilesTableBody(entries, repoPath)
    }

    static _appendRepoFilesTable = () => {
        // 先添加自己，再添加子元素
        let t = `
            <table id="repo-files-table" class="ui unstackable fixed single line table"></table>
        `
        appendHtml(this.bodyWrapperSel, t)
    }

    static _appendFilesTableHead = (latest_commit: LatestCommitItem, repoPath: RepoPath) => {
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
                           data-path="/${username}/${repoName}/commit/${hash_code}" data-action="hashDiff">${hash}</a>
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

    static _appendFilesTableBody = (entries: [], repoPath: RepoPath) => {
        // 先添加自己，再添加文件目录
        let t: string = `
            <tbody class="class-files-tboody"></tbody>
        `
        let parentSel: HTMLSelectElement = e(`#repo-files-table`)
        appendHtml(parentSel, t)
        //
        this._appendFiles(entries, repoPath)
    }

    static _appendFiles = (entries: [], repoPath: RepoPath) => {
        let self = this
        // 如果当前目录是二级目录，需要添加父目录层
        this._appendFilesParent(repoPath)
        //
        let parentSel: HTMLSelectElement = e(`.class-files-tboody`)
        let username: string = repoPath.username
        let repoName: string = repoPath.repoName
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
            // 获取 data-path
            let r = {...repoPath}
            r.suffixType = type
            r.suffix = _path
            let dataPath: string = self.pathForRepo(r)
            let t: string = `
                <tbody class="class-files-tboody">
                    <tr>
                    <td class="name">
                        ${span}
                        <a class="a-files-path-name" data-path="${dataPath}" data-action="enter">${name}</a>
                    </td>
                    <td class="message collapsing has-emoji">
                        <a rel="nofollow" class="ui sha label"
                           data-path="/${username}/${repoName}/commit/${hashCode}" data-action="hashDiff">${hashCode.substring(0, 10)}</a>
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
            this._parseReadme(repoPath, readmePath)
        }
    }

    static _appendFilesParent = (repoPath: RepoPath) => {
        let self = this
        if (repoPath.suffix !== undefined) {
            let parentSel: HTMLSelectElement = e(`.class-files-tboody`)
            let pathArray: string[] = repoPath.suffix.split('/')
            repoPath.suffix = pathArray.splice(0, pathArray.length - 1).join('/')
            repoPath.suffixType = EnumFileType.dir
            let dataPath: string = self.pathForRepo(repoPath)
            let t: string = `
                <tr class="has-parent">
                    <td colspan="3">
                    <i class="octicon octicon-mail-reply"></i>
                    <a class="a-files-path-name" data-path="${dataPath}" data-action="enter">..</a></td>
                </tr>
            `
            prependHtml(parentSel, t)
        }
    }

    static _parseReadme = (repoPath: RepoPath, readmePath: string) => {
        // 获取 readme 文件的内容
        let r = {...repoPath}
        r.suffix = readmePath
        r.suffixType = EnumFileType.file
        let self = this
        let path = self.pathForRepo(r)
        let repoName = r.repoName
        let username = r.username
        APIContainer.repoTarget(`${path}`, function (r) {
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
            repoPath: params.repoPath,
            repoOverview: params.repo_overview,
        }
        self._parseSecondaryMenu(p)
        // 解析文件，包括最新 commit 栏、文件目录栏、readme.md 栏位
        self._appendFilesTable(params.entries, params.repoPath, params.latest_commit)
    }

    static enterFile = (params: ParamsEnterFile) => {
        let self = this
        // 清空页面 body-wrapper
        self._clearBodyWrapper()
        // 添加二级菜单，包括分支栏、当前目录栏、新文件栏、克隆栏
        let paramsParseSecondaryMenu: ParamsParseSecondaryMenu = {
            repoPath: params.repoPath,
            repoOverview: params.repo_overview,
            displayFileButtons: false,
        }
        self._parseSecondaryMenu(paramsParseSecondaryMenu)
        // 解析文件，包括文件名栏、文件内容
        self._parseFileContent(params.repoPath, params.content)
    }

    static _parseFileContent = (repoPath: RepoPath, content: string) => {
        // 增加文件名栏
        this._appendFileHeader(repoPath)
        // 填充内容
        this.fillFileContent(content)
    }

    static _appendFileHeader = (repoPath: RepoPath) => {
        let username: string = repoPath.username
        let repoName: string = repoPath.repoName
        let checkoutName: string = repoPath.checkoutName
        // 解析内容
        let filename = repoPath.suffix.split('/').splice(-1)
        let t: string = `
            <div id="file-content" class="tab-size-8">
                <h4 class="ui top attached header" id="repo-read-file">
                    <i class="octicon octicon-file-text ui left"></i>
                    <strong>${filename}</strong>
                    <span class="text grey normal">4 B</span>
                    <div class="ui right file-actions">
                        <div class="ui buttons">
                            <a class="ui button" href="/${username}/${repoName}/src/a61c249028cd1120582f506a68bf8fecc6a3b099/${filename}">Permalink</a>
                            <a class="ui button" href="/${username}/${repoName}/commits/${checkoutName}/${filename}">History</a>
                            <a class="ui button" href="/${username}/${repoName}/raw/${checkoutName}/${filename}">Raw</a>
                        </div>
                        <a href="/${username}/${repoName}/_edit/${checkoutName}/${filename}"><i class="octicon octicon-pencil btn-octicon poping up" data-content="Edit this file" data-position="bottom center" data-variation="tiny inverted"></i></a>
                        <a href="/${username}/${repoName}/_delete/${checkoutName}/${filename}"><i class="octicon octicon-trashcan btn-octicon btn-octicon-danger poping up" data-content="Delete this file" data-position="bottom center" data-variation="tiny inverted"></i></a>
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
    static parseCommits = (target: HTMLSelectElement) => {
        let self = this
        let path = target.dataset.path
        APIContainer.repoTarget(path, function (r) {
            let response = JSON.parse(r)
            let responseRepoCommits: ResponseRepoCommits = response.data
            log("responseRepoCommits", responseRepoCommits)
            // 清空页面 body-wrapper
            self._clearBodyWrapper()
                        // 设置布局
            self._setRepositoryCommits()
            // 添加二级菜单，包括分支栏
            let paramsParseSecondaryMenu: ParamsParseSecondaryMenu = {
                repoPath: self.repoForPath(path),
                repoOverview: responseRepoCommits.repo_overview,
            }
            self._parseCommitsSecondaryMenu(paramsParseSecondaryMenu)
            // 添加commit
            self._parseCommitsTable(path, responseRepoCommits.commit_list)
        })
    }

    static _setRepositoryCommits = () => {
        let repositorySel = e(`.repository`)
        repositorySel.className = 'repository commits'
    }

    static _parseCommitsSecondaryMenu = (
        params: ParamsParseSecondaryMenu
    ) => {
        // 先添加自己，再添加子元素
        this._appendSecondaryMenu()
        // 分支选择栏
        this._appendMenuGitChoose(params.repoPath, params.repoOverview)
        this._appendCommitHeader(params.repoPath)
    }

    static _appendCommitHeader = (repoPath: RepoPath) => {
        let username: string = repoPath.username
        let repoName: string = repoPath.repoName
        let checkoutName: string = repoPath.checkoutName
        let path = repoPath.path
        let arg: string = path.split('/')[3]
        let t = `
            <h4 class="ui top attached header">
                Commit History
                <div class="ui right">
                <form action="/${username}/${repoName}/${arg}/${checkoutName}/search">
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
        let checkoutName: string = repoPath.checkoutName
        let arg: string = repoPath.target
        let tr: string = ``
        for (let item of commit_list) {
            tr += `
                <tr>
                    <td class="author">
                        <img class="ui avatar image" src="https://secure.gravatar.com/avatar/9477f6251d8aa33b64fb64f6a7c377d0?d=identicon" alt="">
                        ${item.author}
                    </td>
                    <td class="message collapsing">
                        <a rel="nofollow" class="ui sha label" data-path="/${username}/${repoName}/commit/${item.hash_code}" data-action="hashDiff">
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

    static parseBranches = (target: HTMLSelectElement) => {
        let self = this
        let path = target.dataset.path
        APIContainer.repoBranches(path, function (r) {
            let response = JSON.parse(r)
            let resp: ResponseRepoBranches = response.data
            let repoPath: RepoPath = self.repoForPath(path)
            // 清空页面 body-wrapper
            self._clearBodyWrapper()
            // 设置布局
            self._setRepositoryBranches(path)
            // 设置菜单
            self._parseNavbar(repoPath, path)
            // 设置 default
            self._parseDefaultBranch(resp.default, repoPath, path)
            // 设置 actives
            self._parseActiveBranches(resp.active_list, repoPath, path)
        })
    }

    static _setRepositoryBranches = (path: string) => {
        let repositorySel = e(`.repository`)
        if (path.includes('/branches/all')) {
            repositorySel.className = 'repository branches all'
        } else {
            repositorySel.className = 'repository branches overview'
        }
    }

    static _parseNavbar = (repoPath: RepoPath, path: string) => {
        let username: string = repoPath.username
        let repoName: string = repoPath.repoName

        let t: string = `
            <div class="navbar">
                <div class="ui compact small menu">
                    <a class=" item class-branches-overview" data-path="/${username}/${repoName}/branches/overview" data-action="branches">Overview</a>
                    <a class=" item class-branches-all" data-path="/${username}/${repoName}/branches/all" data-action="branches">All Branches</a>
                </div>
            </div>
        `
        appendHtml(this.bodyWrapperSel, t)
        // 设置 active
        let sel: HTMLSelectElement
        // 根据路由不同设置 header
        let header: string
        if (path.includes('/branches/all')) {
            sel = e(`.class-branches-all`)
            header = `
                <div class="ui top attached header class-all-branches">
                    All Branches
                </div>
                <div class="ui attached segment list class-all-branches-list"></div>
            `
        } else {
            sel = e(`.class-branches-overview`)
            header = `
                <div class="ui top attached header class-default-branch">
                    Default Branch
                </div>
                <div class="ui attached segment list class-default-branch-list"></div>
                <div class="ui top attached header class-active-branch">
                    Active Branches
                </div>
                <div class="ui attached segment list class-active-branch-list"></div>
            `
        }
        // 增加 navbar 标识
        sel.className += ' active'
        //
        appendHtml(this.bodyWrapperSel, header)
    }

    static _parseDefaultBranch = (commit: BranchLatestCommit, repoPath: RepoPath, path: string) => {
        let username: string = repoPath.username
        let repoName: string = repoPath.repoName

        let r: RepoPath = {...repoPath}
        r.checkoutName = commit.checkout_name
        r.target = 'src'
        let dataPath = this.pathForRepo(r)
        let t: string = `
            <div class="item ui grid">
                <div class="ui eleven wide column">
                    <a class="markdown">
                        <code data-path="${dataPath}" data-action="checkout">${commit.checkout_name}</code>
                    </a>
                    <span class="ui text light grey">
                        Updated 
                        <span class="time-since poping up" title="" data-content="Mon, 01 May 2023 15:11:03 UTC" data-variation="inverted tiny">
                        ${commit.commit_time}
                        </span> by ${commit.author}
                    </span>
                </div>
                <div class="ui four wide column">
                    <a class="ui basic blue button" data-path="/${username}/${repoName}/settings/branches">
                        Change Default Branch
                    </a>
                </div>
            </div>
        `
        let sel: HTMLSelectElement
        if (path.includes('/branches/all')) {
            sel = e(`.class-all-branches-list`)
        } else {
            sel = e(`.class-default-branch-list`)
        }
        appendHtml(sel, t)
    }

    static _parseActiveBranches = (activeList: BranchLatestCommit[], repoPath: RepoPath, path: string) => {
        let username: string = repoPath.username
        let repoName: string = repoPath.repoName

        let item: string = ``
        for (let branchLatestCommit of activeList) {
            let r: RepoPath = {...repoPath}
            r.target = 'src'
            r.checkoutName = branchLatestCommit.checkout_name
            let dataPath = this.pathForRepo(r)
            item += `
                <div class="item ui grid">
                    <div class="ui eleven wide column">
                        <a class="markdown">
                            <code data-path="${dataPath}" data-action="checkout">${branchLatestCommit.checkout_name}</code>
                        <span class="ui text light grey">
                            Updated 
                            <span class="time-since poping up" title="" data-content="Wed, 03 May 2023 01:23:25 UTC" data-variation="inverted tiny">
                            ${branchLatestCommit.commit_time}
                            </span> by ${branchLatestCommit.author}
                        </span>
                    </div>
                    <div class="ui four wide column">
                        <a class="ui basic button" href="/${username}/${repoName}/compare/master...${branchLatestCommit.checkout_name}">
                            <i class="octicon octicon-git-pull-request"></i> 
                            New Pull Request
                        </a>
                    </div>
                </div>
            `
        }
        let sel: HTMLSelectElement
        if (path.includes('/branches/all')) {
            sel = e(`.class-all-branches-list`)
        } else {
            sel = e(`.class-active-branch-list`)
        }
        appendHtml(sel, item)
    }

    static parseReleases = (target: HTMLSelectElement) => {
        let self = this
        let path = target.dataset.path
        APIContainer.repoTarget(path, function (r) {
            let response = JSON.parse(r)
            let resp: ResponseRepoReleases = response.data
            let repoPath: RepoPath = self.repoForPath(path)
            // 清空页面 body-wrapper
            self._clearBodyWrapper()
        //    设置 release
            self._setRepositoryReleases()
        //    增加 header
            self._parseReleasesHeader(repoPath)
        //    增加 release list
            self._parseReleasesList(repoPath, resp.release_list)
        })
    }

    static _setRepositoryReleases = () => {
        let repositorySel = e(`.repository`)
        repositorySel.className = 'repository release'
    }

    static _parseReleasesHeader = (repoPath: RepoPath) => {
        let username: string = repoPath.username
        let repoName: string = repoPath.repoName
        let t = `
            <h2 class="ui header">
                Releases
                <div class="ui right">
                    <a class="ui small green button" data-path="/${username}/${repoName}/releases/new">
                    New Release
                    </a>
                </div>
            </h2>
        `
        appendHtml(this.bodyWrapperSel, t)
    }

    static _parseReleasesList = (repoPath: RepoPath, branchLatestCommitList: BranchLatestCommit[]) => {
        let username: string = repoPath.username
        let repoName: string = repoPath.repoName
        let li: string = ``
        for (let commit of branchLatestCommitList) {
            let r = {...repoPath}
            r.target = 'src'
            r.checkoutType = EnumCheckoutType.tag
            r.checkoutName = commit.checkout_name
            let detailDataPath = this.pathForRepo(r)
            li += `
                <li class="ui grid">
                    <div class="ui four wide column meta">
                        <span class="commit">
                            <a data-path="/${username}/${repoName}/src/${commit.hash_code}"rel="nofollow">
                                <i class="code icon"></i> ${commit.hash_code.substring(0, 10)}</a>
                        </span>
                    </div>
                    <div class="ui twelve wide column detail">
                        <h4>
                            <a data-path="${detailDataPath}" rel="nofollow" data-action="checkout" ><i class="tag icon">
                                </i> ${commit.checkout_name}
                            </a>
                        </h4>
                        <div class="download">
                            <a  rel="nofollow"><i class="octicon octicon-file-zip"></i>${commit.commit_message}</a>
                            <a ><i class="octicon octicon-file-zip"></i>${commit.commit_time}</a>
                        </div>
                        <span class="dot">&nbsp;</span>
                    </div>
                </li>
            `
        }
        let tt = `
            <ul id="release-list">
                ${li}
            </ul>
        `
        let ttt = `
            <div class="center">
                <a class="ui small button disabled">
              Previous
                </a>
                <a class="ui small button disabled">
                Next
                </a>
            </div>
        `
        appendHtml(this.bodyWrapperSel, tt)
        appendHtml(this.bodyWrapperSel, ttt)
    }

    static parseHashDiff = (target) => {
        let self = this
        let path = target.dataset.path
        APIContainer.repoTarget(path, function (r) {
            let response = JSON.parse(r)
            let resp: ResponseRepoCommitHash = response.data
            log("response data", resp)
            let repoPath: RepoPath = self.repoForPath(path)
            // 清空页面 body-wrapper
            self._clearBodyWrapper()
        //    设置布局
            self._setRepositoryCommitDiff()
        //    增加 header
            self._parseCommitDiffHeader(repoPath, resp.commit, resp.parent_id)
        //    增加 list
            self._parseCommitDiffList(repoPath, resp.patch_text_list)
        })
    }

    static _setRepositoryCommitDiff = () => {
        let repositorySel = e(`.repository`)
        repositorySel.className = 'repository diff'
    }

    static _parseCommitDiffHeader = (repoPath: RepoPath, commit: LatestCommitItem, parentId: string) => {
        let username: string = repoPath.username
        let repoName: string = repoPath.repoName
        let parent: string = ``
        if (parentId !== null) {
            parent += `
                <div class="ui right">
                    <div class="ui horizontal list">
                        <div class="item">
                            parent
                        </div>
                    <div class="item">
                    <a class="ui blue sha label" data-path="/${username}/${repoName}/commit/${parentId}" data-action="hashDiff">
                        ${parentId.substring(0, 10)}
                    </a>
                </div>
            `
        }
        let t = `
            <div class="ui top attached info clearing segment">
                <a class="ui floated right blue tiny button" data-path="/${username}/${repoName}/src/${commit.hash_code}">
                    Browse Source
                </a>
                <div class="commit-message">
                    <h3>${commit.commit_message}</h3>
                </div>
            </div>
            
            <div class="ui attached info segment">
                <img class="ui avatar image" src="https://secure.gravatar.com/avatar/9477f6251d8aa33b64fb64f6a7c377d0?d=identicon" />
                <strong>${commit.author}</strong>
            
                <span class="text grey" id="authored-time">
                    <span class="time-since" title="Fri, 12 May 2023 09:53:52 UTC">
                        ${commit.commit_time}
                    </span>
                </span>
                    ${parent}
            
                <div class="item">commit</div>
                <div class="item"><span class="ui blue sha label">${commit.hash_code.substring(0, 10)}</span></div>
            </div>
        `
        appendHtml(this.bodyWrapperSel, t)
    }

    static _parseCommitDiffList = (repoPath: RepoPath, patchTextList: string[]) => {
        let username: string = repoPath.username
        let repoName: string = repoPath.repoName
        // 总加行树
        let additions: number = 0
        // 总减行树
        let deletions: number = 0
        let file: string = ``
        for (let text of patchTextList) {
            let lines = text.split('\n')
            log("lines-------", lines)

            // 文件名在第一行
            let fileName = lines[0].split(' ')[2].split('/').splice(1).join('/')
            // 找到文件行号显示加减 @@ -0,0 +1 @@
            let tagOffset: number = -1
            let tagLine: string
            for (let offset = 0; offset < lines.length; offset++) {
                if (lines[offset].startsWith('@@')) {
                    tagOffset = offset
                    tagLine = lines[offset]
                    break
                }
            }

            let fileTemplate: string = ``
            let diffCounter: string
            // 等于 -1 说明没有内容显示
            if (tagOffset == -1) {
                diffCounter = 'BIN'
            } else {
                // 从下一行开始就是文件
                let addOffset: number = 0
                let delOffset: number = 0
                let fileLines: string[] = lines.splice(tagOffset)
                let i: number = -1
                for (let l of fileLines) {
                    i ++
                    if (l.startsWith('@@')) {
                        fileTemplate += `
                            <tr class="tag-code nl-0 ol-0">
                                <td colspan="2" class="lines-num"></td>
                                <td class="lines-code">
                                    <pre><code class="language-nohighlight">${tagLine}</code></pre>
                                </td>
                            </tr>
                        `
                    } else if (l.startsWith('+')) {
                        addOffset ++
                        fileTemplate += `
                            <tr class="add-code nl-${i} ol-${i}">
                                <td class="lines-num lines-num-old"></td>
                                <td class="lines-num lines-num-new" id="diff-" data-line-number="${i}"></td>
                                <td class="lines-code">
                                    <pre><code class="language-nohighlight">${l}</code></pre>
                                </td>
                            </tr>
                        `
                    } else if (l.startsWith('-')) {
                        delOffset ++
                        fileTemplate += `
                            <tr class="del-code nl-${i} ol-${i}">
                                <td class="lines-num lines-num-old"></td>
                                <td class="lines-num lines-num-new" id="diff-" data-line-number="${i}"></td>
                                <td class="lines-code">
                                    <pre><code class="language-nohighlight">${l}</code></pre>
                                </td>
                            </tr>
                        `
                    } else {
                        fileTemplate += `
                            <tr class="same-code nl-${i} ol-${i}">
                                <td class="lines-num lines-num-old"></td>
                                <td class="lines-num lines-num-new" id="diff-" data-line-number="${i}"></td>
                                <td class="lines-code">
                                    <pre><code class="language-nohighlight">${l}</code></pre>
                                </td>
                            </tr>
                        `
                    }
                }
                diffCounter = `
                    <span class="add" data-line="${addOffset}">+ ${addOffset}</span>
                            <span class="bar">
                                <span class="pull-left add" style="width: ${addOffset / (addOffset + delOffset) * 100}%;"></span>
                                <span class="pull-left del"></span>
                            </span>
                    <span class="del" data-line="${delOffset}">- ${delOffset}</span>
                `
                additions += addOffset
                deletions += delOffset
            }
            file += `
                <div class="diff-file-box diff-box file-content tab-size-8" id="diff-9e7513f77c131687500db2d3e204a0b076ab0825">
                    <h4 class="ui top attached normal header">
                        <div class="diff-counter count ui left">
                            ${diffCounter}
                        </div>
                        <span class="file">${fileName}</span>
                        <div class="ui right">
                            <a class="ui basic grey tiny button" rel="nofollow" data-path="/${username}/${repoName}/src/${username}/${fileName}">View File</a>
                        </div>
                    </h4>
                    <div class="ui unstackable attached table segment">
                        <div class="file-body file-code code-view code-diff">
                            <table>
                                <tbody>
                                    ${fileTemplate}
                                </tbody>    
                            </table>
                        </div>
                    </div>
                </div>
            `
        }

        // 头部
        let t: string = `
            <div class="diff-detail-box diff-box">
                <div>
                    <i class="fa fa-retweet"></i>
                    <strong> ${patchTextList.length} changed files</strong> with <strong>${additions} additions</strong> and <strong>${deletions} deletions</strong>
                    <div class="ui right">
                        <a class="ui tiny basic toggle button" href="?style=split">Split View</a>
                        <a class="ui tiny basic toggle button" data-target="#diff-files">Show Diff Stats</a>
                    </div>
                </div>

                <ol class="detail-files hide" id="diff-files">            
                    <li>
                        <div class="diff-counter count pull-right">
                            <span class="add" data-line="0">0</span>
                            <span class="bar">
                                <span class="pull-left add" style="width: 0%;"></span>
                                <span class="pull-left del"></span>
                            </span>
                            <span class="del" data-line="3">3</span>
                        </div>
                        
                        <span class="status modify poping up" data-content="modify" data-variation="inverted tiny" data-position="right center">&nbsp;</span>
                        <a class="file" href="#diff-e4539619761dcf92bb1ab70c4b397984b931cf6b">test1.txt</a>
                    </li>

                    <li>
                        <div class="diff-counter count pull-right">
                            <span class="add" data-line="1">1</span>
                            <span class="bar">
                                <span class="pull-left add" style="width: 100%;"></span>
                                <span class="pull-left del"></span>
                            </span>
                            <span class="del" data-line="0">0</span>
                        </div>
                        
                        <span class="status modify poping up" data-content="modify" data-variation="inverted tiny" data-position="right center">&nbsp;</span>
                        <a class="file" href="#diff-a52d85aaf33af8bbaf27d40985cd9065356a061c">v2.txt</a>
                    </li>
                </ol>
            </div>
        `
        appendHtml(this.bodyWrapperSel, t)
        appendHtml(this.bodyWrapperSel, file)
    //
    }
}

class RepoEvent {

    static enter = (target: HTMLSelectElement) => {
        log("enter click path --- ", target)
        let path = target.dataset.path
        // 说明访问的是主路径
        if (path.includes('suffix')) {
            let repoPath = RepoContainer.repoForPath(path)
            log("repoPath", repoPath)
            APIContainer.repoTarget(`${path}`, function (r) {
                let response = JSON.parse(r)
                log("response:", response.data)
                let res: ResponserRepoSuffix = response.data
                if (repoPath.suffixType === EnumFileType.dir) {
                    // 进入文件二级目录
                    let params: ParamsEnterSecondaryDir = {
                        entries: res.entries,
                        repoPath: repoPath,
                        latest_commit: res.latest_commit,
                        repo_overview: res.repo_overview,
                    }
                    RepoContainer.enterSecondaryDir(params)
                } else {
                    // 解析文件
                    let params: ParamsEnterFile = {
                        repoPath: repoPath,
                        content: res.content,
                        repo_overview: res.repo_overview,
                    }
                    RepoContainer.enterFile(params)
                }
            })
        } else {
            RepoContainer.initRepo(path)
        }
    }

    static quit = (target: HTMLSelectElement) => {
        log("quit click path --- ", target)
        let path: string = target.dataset.path
        if (path.includes('suffix')) {
            let repoPath = RepoContainer.repoForPath(path)
            APIContainer.repoTarget(`${path}`, function (r) {
                let response = JSON.parse(r)
                log("response:", response.data)
                let res: ResponserRepoSuffix = response.data
                // 进入文件二级目录
                let params: ParamsEnterSecondaryDir = {
                    entries: res.entries,
                    repoPath: repoPath,
                    latest_commit: res.latest_commit,
                    repo_overview: res.repo_overview,
                }
                RepoContainer.enterSecondaryDir(params)
            })
        } else {
            RepoContainer.initRepo(path)
        }
    }

    // 监听浮动选择器
    static visible = () => {
        log("点击到了 visible 事件")
        //
        let floatingBranchSel: HTMLSelectElement = e(`.class-floating-filter-dropdown`)
        floatingBranchSel.className += ' active visible'
        //
        let menuBranchSel: HTMLSelectElement = e(`.class-floating-menu`)
        menuBranchSel.className += ' transition visible'
        menuBranchSel.style.display = 'block !important'
        // 设置 body 的 dataset 为 visible 状态，开始统计点击 visible 状态
        let chooseSel = e(`body`)
        chooseSel.dataset.visible = "0"
    }

    // 监听浮动选择器
    static checkout = (target: HTMLSelectElement) => {
        log("checkout click path --- ", target)
        let path: string = target.dataset.path
        let arg: string = path.split('?')[0].split('/')[3]
        if (arg === 'src') {
            this.enter(target)
        } else if (arg === 'commits') {
            RepoContainer.parseCommits(target)
        } else if (arg === 'branches') {
            RepoContainer.parseBranches(target)
        }
    }

    // 监听点击事件，假设这时候有浮动的过滤器展开了，设置为关闭
    static bindClick = () => {
        bindEvent('body', 'click', function (event) {
            let bodySel = e('body')
            let target = event.target as HTMLSelectElement
            // 之所以多这一步设置为 "1" 的状态，是因为这一次监听点击跟上面的监听 visible 点击是同步发生的，所以需要多走一步
            if (bodySel.dataset.visible == '0') {
                bodySel.dataset.visible = "1"

            } else if (e('body').dataset.visible == '1' && !target.className.includes('text') && !target.className.includes('item')) {
                // visible 设置为 -1
                bodySel.dataset.visible = "-1"
                // 关闭浮动器
                let floatingBranchSel: HTMLSelectElement = e(`.class-floating-filter-dropdown`)
                let floatingBranchClassNames: string[] = floatingBranchSel.className.split(' ')
                floatingBranchSel.className = floatingBranchClassNames.splice(0, floatingBranchClassNames.length - 2).join(' ')
                //
                let menuBranchSel: HTMLSelectElement = e(`.class-floating-menu`)
                let menuBranchSelClassNames = menuBranchSel.className.split(' ')
                menuBranchSel.className = menuBranchSelClassNames.splice(0, menuBranchSelClassNames.length - 2).join(' ')
                menuBranchSel.style.display = 'none'
            }
        })
    }

    // 监听 branch 和 tag 显示列表
    static parseScrolling = (target: HTMLSelectElement) => {
        log("parseScrolling click target --- ", target)
        // 设置文字变黑
        target.className += ' black'
        // 设置对面文字变蓝
        let checkoutText = target.className.includes('class-checkout-text-branch') ? 'class-checkout-text-tag' : 'class-checkout-text-branch'
        let checkoutTextSel = e(`.${checkoutText}`)
        checkoutTextSel.className = `text ${checkoutText}`
        // 设置父元素指向的列表展示出来
        let parent = target.parentElement
        let targetId = parent.dataset.target
        let targetSel = e(`${targetId}`)
        targetSel.style.display = 'block'
        // 设置对面列表隐藏
        let listId = targetId === '#tag-list' ? '#branch-list' : '#tag-list'
        let listSel = e(`${listId}`)
        listSel.style.display = 'none'
    }
}

class ActionRepo extends Action {
    static eventActions = {
        'click': {
            'enter': RepoEvent.enter,
            'quit': RepoEvent.quit,
            'visible': RepoEvent.visible,
            'checkout': RepoEvent.checkout,
            'scrolling': RepoEvent.parseScrolling,
        //
            'commits': RepoContainer.parseCommits,
            'branches': RepoContainer.parseBranches,
            'releases': RepoContainer.parseReleases,
            'hashDiff': RepoContainer.parseHashDiff,
        },
    }
}
