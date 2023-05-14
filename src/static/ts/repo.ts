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
                <a>
                    <button class="ui green small button" data-path="/${username}/${repoName}/compare/master...${checkoutName}" data-action="compare">
                    <i class="octicon octicon-git-compare"></i>
                    </button>
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
                // 设置路径拼接
                if (i == 0) {
                    suffix += p
                } else {
                    suffix += `/${p}`
                }
                let r: RepoPath = repoPath
                r.suffix = suffix
                r.suffixType = EnumFileType.dir
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
                           data-path="/${username}/${repoName}/commit/${hashCode}?checkoutType=${r.checkoutType}&checkoutName=${r.checkoutName}" data-action="hashDiff">${hashCode.substring(0, 10)}</a>
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
            let s: string = escapeHTML(contentList[i])
            spanTemplate += `
                <span id="L${offset}">${offset}</span>
            `
            liTemplate += `
                <li class="L${offset}" rel="L${offset}">${s}</li>
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
<!--                                    <pre>-->
                                        <code class="nohighlight">
                                            <ol class="linenums">
                                                ${liTemplate}
                                            </ol>
                                        </code>
<!--                                    </pre>-->
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `
        appendHtml(sel, t)
        // 这时候才插入文本，为了保证文本不被执行（假设文本里有 html 代码
        // for (let i = 0; i < contentList.length; i++) {
        //     let liSel = e(`.L${(i + 1).toString()}`)
        //     liSel.innerText = escapeHTML(contentList[i])
        // }
    }

    // --------------------------- 点击 commits ---------------------------
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

    static _parseCommitsTable = (path: string, commit_list: LatestCommitItem[], isCompare: boolean=false) => {
        let repoPath: RepoPath = this.repoForPath(path)
        let username: string = repoPath.username
        let repoName: string = repoPath.repoName
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
        let sel = isCompare ? e(`.sixteen-wide-column-page-grid`) : this.bodyWrapperSel
        appendHtml(sel, t)
    }

    // ------------------ parseBranches ---------------------------------
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

    // ----------------- parseReleases ------------------------------
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

    // ---------------- parseHashDiff ------------------------
    static _setRepositoryCommitDiff = () => {
        let repositorySel = e(`.repository`)
        repositorySel.className = 'repository diff'
    }

    static _setBodyWrapperCommitDiff = () => {
        this.bodyWrapperSel.className = 'ui container body-wrapper'
    }

    static _parseCommitDiffHeader = (repoPath: RepoPath, commit: LatestCommitItem, parentId: string) => {
        let username: string = repoPath.username
        let repoName: string = repoPath.repoName
        let parent: string = ``
        if (parentId !== null) {
            parent += `
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
                <div class="ui right">
                    <div class="ui horizontal list">
                        ${parent}
            
                    <div class="item">commit</div>
                    <div class="item"><span class="ui blue sha label">${commit.hash_code.substring(0, 10)}</span></div>
                    </div>
                </div>
           </div>
        `
        appendHtml(this.bodyWrapperSel, t)
    }

    static _parseCommitDiffList = (
        repoPath: RepoPath,
        patchTextList: string[],
        path: string,
        isSplitView: boolean=false,
        isGrid: boolean=false
    ) => {
        // 总加行树
        let additions: number = 0
        // 总减行树
        let deletions: number = 0
        // 文件名隐藏总览
        let diffFiles: string = ``
        // 文件展示内容
        let file: string = ``
        // 旧代码行数开始
        let linesNumOld: number = 0
        // 新代码行数开始
        let linesNumNew: number = 0
        for (let text of patchTextList) {
            let lines = text.split('\n')
            // 文件名在第一行
            let fileName = lines[0].split(' ')[2].split('/').splice(1).join('/')
            // 找到文件行号显示加减 @@ -0,0 +1 @@
            let tagOffset: number = -1
            let tagLine: string
            for (let offset = 0; offset < lines.length; offset++) {
                let line: string = lines[offset]
                if (line.startsWith('@@')) {
                    tagOffset = offset
                    tagLine = line
                    // 解析旧代码行数 和 新代码行数
                    let lineList: string[] = line.split(' ')
                    linesNumOld = parseDiffLinesNum(lineList[1])
                    linesNumNew = parseDiffLinesNum(lineList[2])
                    break
                }
            }
            // 文件内容
            let fileTemplate: string = ``
            // 加减血条
            let diffCounter: string
            // 等于 -1 说明没有内容显示
            let addOffset: number = 0
            let delOffset: number = 0
            if (tagOffset == -1) {
                // diffCounter = 'BIN'
            } else {
                // 从下一行开始就是文件
                let fileLines: string[] = lines.splice(tagOffset)
                let i: number = -1
                for (let l of fileLines) {
                    l = escapeHTML(l)
                    i++
                    if (l.length === 0) {

                    } else if (l.startsWith('@@')) {
                        if (isSplitView) {
                            fileTemplate += `
                            <tr class="tag-code nl-0 ol-0">
                               <td class="lines-num"></td>
                                <td colspan="3" class="lines-code">
                                <pre><code class="language-nohighlight">${tagLine}</code></pre>
                                </td>
                            </tr>
                        `
                        } else {
                            fileTemplate += `
                            <tr class="tag-code nl-0 ol-0">
                                <td colspan="2" class="lines-num"></td>
                                <td class="lines-code">
                                    <pre><code class="language-nohighlight">${tagLine}</code></pre>
                                </td>
                            </tr>
                        `
                        }
                    } else if (l.startsWith('+')) {
                        addOffset++
                        let code: string = this.diffListCodeForSplitView(i, l, isSplitView, linesNumOld, linesNumNew)
                        linesNumNew ++
                        fileTemplate += `
                            <tr class="add-code nl-${i} ol-${i}">
                                ${code}
                            </tr>
                        `
                    } else if (l.startsWith('-')) {
                        delOffset++
                        let code: string = this.diffListCodeForSplitView(i, l, isSplitView, linesNumOld, linesNumNew)
                        linesNumOld ++
                        fileTemplate += `
                            <tr class="del-code nl-${i} ol-${i}">
                                ${code}
                            </tr>
                        `
                    } else {
                        let code: string = this.diffListCodeForSplitView(i, l, isSplitView, linesNumOld, linesNumNew)
                        linesNumNew ++
                        linesNumOld ++
                        fileTemplate += `
                            <tr class="same-code nl-${i} ol-${i}">
                                ${code}
                            </tr>
                        `
                    }
                }
            }
            let width: number = addOffset / (addOffset + delOffset) * 100
            diffCounter = `
                <span class="add" data-line="${addOffset}">+ ${addOffset}</span>
                        <span class="bar">
                            <span class="pull-left add" style="width: ${width}%;"></span>
                            <span class="pull-left del"></span>
                        </span>
                <span class="del" data-line="${delOffset}">- ${delOffset}</span>
            `
            // 设置文件隐藏总览的前面小方块颜色
            let spanStatus: string
            if (addOffset === 0 && delOffset == 0) {
                spanStatus = `
                    <span class="status add poping up" data-content="add" data-variation="inverted tiny" data-position="right center">&nbsp;</span>
                `
            } else {
                spanStatus = `
                    <span class="status modify poping up" data-content="modify" data-variation="inverted tiny" data-position="right center">&nbsp;</span>
                `
            }
            diffFiles += `
                <li>
                    <div class="diff-counter count pull-right">
                        <span class="add" data-line="${addOffset}">${addOffset}</span>
                        <span class="bar">
                            <span class="pull-left add" style="width: ${width}%;"></span>
                            <span class="pull-left del"></span>
                        </span>
                        <span class="del" data-line="${delOffset}">${delOffset}</span>
                    </div>
                    ${spanStatus}                    
                    <a class="file" href="#diff-e4539619761dcf92bb1ab70c4b397984b931cf6b">${fileName}</a>
                </li>
            `
            additions += addOffset
            deletions += delOffset

            // 设置跳转链接
            let r = {...repoPath}
            r.target = 'src'
            r.suffix = fileName
            r.suffixType = EnumFileType.file
            let dataPath = this.pathForRepo(r)
            file += `
                <div class="diff-file-box diff-box file-content tab-size-8" id="diff-9e7513f77c131687500db2d3e204a0b076ab0825">
                    <h4 class="ui top attached normal header">
                        <div class="diff-counter count ui left">
                            ${diffCounter}
                        </div>
                        <span class="file">${fileName}</span>
                        <div class="ui right">
                            <a class="ui basic grey tiny button" rel="nofollow" data-path="${dataPath}" data-action="enter">View File</a>
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
                <br>
            `
        }

        // view 按钮
        let view: string
        if (isSplitView) {
            view = `
                <a class="ui tiny basic toggle button" data-path="${path}" data-action="unifiedView">Unified View</a>
            `
        } else {
            view = `
                <a class="ui tiny basic toggle button" data-path="${path}" data-action="splitView">Split View</a>
            `
        }
        // 头部
        let t: string = `
            <div class="diff-detail-box diff-box">
                <div>
                    <i class="fa fa-retweet"></i>
                    <strong> ${patchTextList.length} changed files</strong> with <strong>${additions} additions</strong> and <strong>${deletions} deletions</strong>
                    <div class="ui right">
                        ${view}
                        <a class="ui tiny basic toggle button" data-target="#diff-files" data-action="showDiffStats">Show Diff Stats</a>
                    </div>
                </div>

                <ol class="detail-files hide" id="diff-files">            
                    ${diffFiles}
                </ol>
            </div>
        `
        // 添加
        let sel = isGrid ? e(`.sixteen-wide-column-page-grid`) : this.bodyWrapperSel
        appendHtml(sel, t)
        appendHtml(sel, file)
    //
    }

    static diffListCodeForSplitView(index: number, line: string, isSplitView: boolean, linesNumOld: number, linesNumNew: number) {
        if (isSplitView) {
            if (line.startsWith('+')) {
                return `
                    <td class="lines-num lines-num-old" id="diff-">
                        </td>
                    <td class="lines-code halfwidth">
                        <pre><code class="wrap language-nohighlight"></code></pre>
                    </td>
                    <td class="lines-num lines-num-new" id="diff-" data-line-number="${linesNumNew}">
                    </td>
                    <td class="lines-code halfwidth">
                        <pre><code class="wrap language-nohighlight"> ${line}</code></pre>
                    </td>
                `
            } else if (line.startsWith('-')) {
                return `
                    <td class="lines-num lines-num-old" id="diff-" data-line-number="${linesNumOld}">
                        </td>
                    <td class="lines-code halfwidth">
                        <pre><code class="wrap language-nohighlight"> ${line}</code></pre>
                    </td>
                    <td class="lines-num lines-num-new" id="diff-">
                    </td>
                    <td class="lines-code halfwidth">
                        <pre><code class="wrap language-nohighlight"></code></pre>
                    </td>
                `
            } else {
                return `
                    <td class="lines-num lines-num-old" id="diff-" data-line-number="${linesNumOld}">
                        </td>
                    <td class="lines-code halfwidth">
                        <pre><code class="wrap language-nohighlight">${line}</code></pre>
                    </td>
                    <td class="lines-num lines-num-new" id="diff-" data-line-number="${linesNumNew}">
                    </td>
                    <td class="lines-code halfwidth">
                        <pre><code class="wrap language-nohighlight"> ${line}</code></pre>
                    </td>
                `
            }

        } else {
            if (line.startsWith('+')) {
                return `
                    <td class="lines-num lines-num-old"></td>
                    <td class="lines-num lines-num-new" id="diff-" data-line-number="${linesNumNew}"></td>
                    <td class="lines-code">
                        <pre><code class="language-nohighlight">${line}</code></pre>
                    </td>
                `
            } else if (line.startsWith('-')) {
                return `
                    <td class="lines-num lines-num-old" data-line-number="${linesNumOld}"></td>
                    <td class="lines-num lines-num-new" id="diff-"></td>
                    <td class="lines-code">
                        <pre><code class="language-nohighlight">${line}</code></pre>
                    </td>
                `
            } else {
                return `
                    <td class="lines-num lines-num-old" data-line-number="${linesNumOld}"></td>
                    <td class="lines-num lines-num-new" id="diff-" data-line-number="${linesNumNew}"></td>
                    <td class="lines-code">
                        <pre><code class="language-nohighlight">${line}</code></pre>
                    </td>
                `
            }
        }
    }

    // -------------- splitView --------------------
    static _setBodyWrapperSplitView = () => {
        this.bodyWrapperSel.className += ' fluid padded'
    }

    // --------------- parseCompare ----------------------
    static _setRepositoryCompare = () => {
        let repositorySel = e(`.repository`)
        repositorySel.className = 'repository compare pull diff'
        // ui-tabs-container
        let selTabsContainer = e(`.ui-tabs-container`)
        if (selTabsContainer !== null) {
            selTabsContainer.remove()
        }
        // ui-tabs-divider
        let selTabsDivider = e(`.ui-tabs-divider`)
        if (selTabsDivider !== null) {
            selTabsDivider.remove()
        }
        // append ui-divider
        let selDivider = e(`.ui-divider`)
        if (selDivider === null) {
            let headerWrapper = e(`.header-wrapper`)
            appendHtml(headerWrapper, `<div class="ui divider ui-divider"></div>`)
        }
    }

    static _parseBodyWrapperCompare = (
        repoPath: RepoPath,
        response: ResponseRepoCompare,
        path: string,
        isSplitView: boolean=false
    ) => {
        // 主分支的菜单栏
        let baseFloatingFilterTemplate = this._templateCompareFloatingFilterTemplate(
            repoPath,
            response.branch_list,
            response.base,
            response.compare
        )
        // 对比分支的菜单栏
        let compareFloatingFilterTemplate = this._templateCompareFloatingFilterTemplate(
            repoPath,
            response.branch_list,
            response.base,
            response.compare,
            false
        )

        // 分支对比
        let compareSegmentTemplate: string = ``
        if (response.patch_text_list.length === 0) {
            compareSegmentTemplate = `
                <div class="ui segment">
                    There is nothing to compare because base and head branches are even.
                </div>
            `
        } else {
            compareSegmentTemplate = `
                <form></form>
            `
        }
        //
        let t = `
          <div class="sixteen wide column page grid sixteen-wide-column-page-grid">
            <h2 class="ui header">
                Compare Changes
                <div class="sub header">Compare two branches and make a pull request for changes.</div>
            </h2>
        
            <div class="ui segment choose branch">
                <span class="octicon octicon-git-compare"></span>
                ${baseFloatingFilterTemplate}
                    ...
                ${compareFloatingFilterTemplate}
            </div>
                ${compareSegmentTemplate}
        </div>
        `
        appendHtml(this.bodyWrapperSel, t)
    // 展示文件差异
        if (response.patch_text_list.length > 0) {
                //    展示 commits
            this._parseCompareCommits(repoPath, response.commits_items)
            this._parseCompareSegment(response.patch_text_list, repoPath, path, isSplitView)
        }
    }

    static _parseCompareCommits(repoPath: RepoPath, commitsItems: CompareCommitsItems) {
        let username = repoPath.username
        let repoName = repoPath.repoName
        let t = `
            <h4 class="ui top attached header">
                Commits
                <a data-path="/${username}/${repoName}/commit/${commitsItems.start}" data-action="hashDiff" class="ui green sha label">
                    ${commitsItems.start.substring(0, 10)}
                </a> 
                ... 
                <a href="/${username}/${repoName}/commit/${commitsItems.end}" data-action="hashDiff" class="ui green sha label">
                    ${commitsItems.end.substring(0, 10)}
                </a>
            </h4>
        `
        appendHtml(e(`.sixteen-wide-column-page-grid`), t)
        this._parseCommitsTable(repoPath.path, commitsItems.commits, true)
    }

    static _templateCompareFloatingFilterTemplate = (
        repoPath: RepoPath,
        branchList: string[],
        base: string='',
        compare: string='',
        isBase: boolean=true
    ) => {
        //
        // 浮动器显示
        let floatingText: string = isBase ? `base: ${base}` : `compare: ${compare}`

        // 分支菜单栏
        let menuBranches: string = ``
        let username: string = repoPath.username
        let repoName: string = repoPath.repoName
        for (let string of branchList) {
            // 主分支
            if (isBase) {
                if (base === string) {
                    menuBranches += `
                        <div class="selected item" data-path="/${username}/${repoName}/compare/${string}...${compare}" data-action="compare">${string}</div>
                    `
                } else {
                    menuBranches += `
                        <div class=" item" data-path="/${username}/${repoName}/compare/${string}...${compare}" data-action="compare">${string}</div>
                    `
                }
            //    对比分支
            } else {
                if (compare === string) {
                    menuBranches += `
                        <div class="selected item" data-path="/${username}/${repoName}/compare/${base}...${string}" data-action="compare">${string}</div>
                    `
                } else {
                    menuBranches += `
                        <div class=" item" data-path="/${username}/${repoName}/compare/${base}...${string}" data-action="compare">${string}</div>
                    `
                }
            }
        }
        // 配置第一句
        let div: string = isBase ? `<div class="ui floating filter dropdown class-floating-filter-dropdown" data-no-results="No results found." tabindex="0">` : `<div class="ui floating filter dropdown class-floating-filter-dropdown" tabindex="0">`
        return `
            ${div}
                <div class="ui basic small button" data-action="visible">
                    <span class="text">${floatingText}</span>
                    <i class="dropdown icon" tabindex="0">
                        <div class="menu" tabindex="-1"></div>
                    </i>
                </div>
                <div class="menu transition hidden class-floating-menu" tabindex="-1">
                    <div class="ui icon search input">
                        <i class="filter icon"></i>
                        <input name="search" placeholder="Filter branch...">
                    </div>
                    <div class="scrolling menu">
                        ${menuBranches}                           
                    </div>
                </div>
            </div>
        `
    }

    static _parseCompareSegment = (patchTextList: string[], repoPath: RepoPath, path: string, isSplitView: boolean) => {
        //    增加 list
        this._parseCommitDiffList(repoPath, patchTextList, path, isSplitView, true)
    }
}
