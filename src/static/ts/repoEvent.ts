class RepoEvent {

    static enter = (target: HTMLSelectElement) => {
        let path = target.dataset.path
        // 说明访问的是主路径
        if (path.includes('suffix')) {
            let repoPath = RepoContainer.repoForPath(path)
            APIContainer.repoTarget(`${path}`, function (r) {
                let response = JSON.parse(r)
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
        let path: string = target.dataset.path
        if (path.includes('suffix')) {
            let repoPath = RepoContainer.repoForPath(path)
            APIContainer.repoTarget(`${path}`, function (r) {
                let response = JSON.parse(r)
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
    static visible = (target) => {
        // 找到 target 的父元素浮动选择器
        let floatingBranchSel: HTMLSelectElement = target.closest(`.class-floating-filter-dropdown`)
        floatingBranchSel.className += ' active visible'
        // 找到父元素下的 class-floating-menu 子元素
        let menuBranchSel: HTMLSelectElement = floatingBranchSel.querySelector(`.class-floating-menu`)
        menuBranchSel.className += ' transition visible'
        menuBranchSel.style.display = 'block !important'
        // 设置 body 的 dataset 为 visible 状态，开始统计点击 visible 状态
        let chooseSel = e(`body`)
        chooseSel.dataset.visible = "0"
    }

    // 监听浮动选择器
    static checkout = (target: HTMLSelectElement) => {
        let path: string = target.dataset.path
        let arg: string = path.split('?')[0].split('/')[3]
        if (arg === 'src') {
            this.enter(target)
        } else if (arg === 'commits') {
            this.parseCommits(target)
        } else if (arg === 'branches') {
            this.parseBranches(target)
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

            } else if (e('body').dataset.visible == '1' && e(`.class-floating-filter-dropdown`).className.includes('active') && !target.className.includes('text') && !target.className.includes('item')) {
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

    static showDiffStats = (target: HTMLSelectElement) => {
        let targetId = target.dataset.target
        let sel = e(`${targetId}`)
        if (sel.style.display === 'none' || sel.style.display.length == 0) {
            sel.style.display = 'block'
        } else {
            sel.style.display = 'none'
        }
    }
//
    // 进入 commits
    static parseCommits = (target: HTMLSelectElement) => {
        let self = RepoContainer
        let path = target.dataset.path
        APIContainer.repoTarget(path, function (r) {
            let response = JSON.parse(r)
            let responseRepoCommits: ResponseRepoCommits = response.data
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

    static parseBranches = (target: HTMLSelectElement) => {
        let self = RepoContainer
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

    static parseReleases = (target: HTMLSelectElement) => {
        let self = RepoContainer
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

    static parseHashDiff = (target) => {
        let self = RepoContainer
        let path = target.dataset.path
        APIContainer.repoTarget(path, function (r) {
            let response = JSON.parse(r)
            let resp: ResponseRepoCommitHash = response.data
            let repoPath: RepoPath = self.repoForPath(path)
            // 清空页面 body-wrapper
            self._clearBodyWrapper()
        //    设置布局
            self._setRepositoryCommitDiff()
            self._setBodyWrapperCommitDiff()
        //    增加 header
            self._parseCommitDiffHeader(repoPath, resp.commit, resp.parent_id)
        //    增加 list
            self._parseCommitDiffList(repoPath, resp.patch_text_list, path)
        })
    }

    static splitView = (target) => {
        let self = RepoContainer
        let path = target.dataset.path
        let repoPath: RepoPath = self.repoForPath(path)
        if (repoPath.target === 'commit') {
            APIContainer.repoTarget(path, function (r) {
                let response = JSON.parse(r)
                // diff commit 的页面
                let resp: ResponseRepoCommitHash = response.data
                    // 清空页面 body-wrapper
                self._clearBodyWrapper()
                //    设置布局
                self._setRepositoryCommitDiff()
                //    设置 body-wrapper 格局
                self._setBodyWrapperSplitView()
                   // 增加 header
                self._parseCommitDiffHeader(repoPath, resp.commit, resp.parent_id)
                //    增加 list
                self._parseCommitDiffList(repoPath, resp.patch_text_list, path, true)
            })
        } else if (repoPath.target === 'compare') {
            APIContainer.repoTarget(path, function (r) {
                let response = JSON.parse(r)
                let resp: ResponseRepoCompare = response.data
                let repoPath: RepoPath = self.repoForPath(path)
                // 清空页面 body-wrapper
                self._clearBodyWrapper()
            //    设置布局
                self._setRepositoryCompare()
            // 主分支栏、对比分支栏、分支对比详情
                self._parseBodyWrapperCompare(repoPath, resp, path, true)
            })
        }
    }

    static unifiedView = (target) => {
        let self = RepoContainer
        let path = target.dataset.path
        let repoPath: RepoPath = self.repoForPath(path)
        if (repoPath.target === 'commit') {
            this.parseHashDiff(target)
        } else if (repoPath.target === 'compare') {
            this.parseCompare(target)
        }
    }

    static parseCompare = (target) => {
        let self = RepoContainer
        let path = target.dataset.path
        APIContainer.repoTarget(path, function (r) {
            let response = JSON.parse(r)
            let resp: ResponseRepoCompare = response.data
            let repoPath: RepoPath = self.repoForPath(path)
            // 清空页面 body-wrapper
            self._clearBodyWrapper()
        //    设置布局
            self._setRepositoryCompare()
        // 主分支栏、对比分支栏、分支对比详情
            self._parseBodyWrapperCompare(repoPath, resp, path)
        })
    }

    static parseHistory = (target) => {
        let self = RepoContainer
        let path = target.dataset.path
        APIContainer.repoTarget(path, function (r) {
            let response = JSON.parse(r)
            let responseRepoCommits: ResponseRepoCommits = response.data
            let repoPath: RepoPath = self.repoForPath(path)
            // 清空页面 body-wrapper
            self._clearBodyWrapper()
            // 设置布局
            self._setRepositoryCommits()
            // 添加二级菜单，包括分支栏
            let paramsParseSecondaryMenu: ParamsParseSecondaryMenu = {
                repoPath: repoPath,
                repoOverview: responseRepoCommits.repo_overview,
            }
            self._parseCommitsSecondaryMenu(paramsParseSecondaryMenu)
            // 添加commit
            self._parseCommitsTable(path, responseRepoCommits.commit_list)
        })
    }

    static createRepo = (target) => {
        let self = RepoContainer
        let bodySel = e(`body`)
        if (e('body').dataset.visible == '1' && e(`.class-floating-filter-dropdown`).className.includes('active') && !target.className.includes('text')) {
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
        // 首页进去的，删除 profile
        self._removeUserProfile()
        // 删除 header-wrapper
        self._removeHeaderWrapper()
        // 删除 body-wrapper
        self._removeBodyWrapper()
        // 设置布局
        self._setRepositoryNewRepo()
        //
        self._parseNewRepo(target.dataset.path)
    }

    static parseEdit = (target) => {
        let self = RepoContainer
        // 清空页面 body-wrapper
        self._clearBodyWrapper()
    //    设置布局
        self._setRepositoryEdit()
    //    增加 form 表单 edit
        self._createEditForm(target.dataset.path)
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
            'showDiffStats': RepoEvent.showDiffStats,
        //
            'commits': RepoEvent.parseCommits,
            'branches': RepoEvent.parseBranches,
            'releases': RepoEvent.parseReleases,
            'hashDiff': RepoEvent.parseHashDiff,
            'splitView': RepoEvent.splitView,
            'unifiedView': RepoEvent.unifiedView,
            'compare': RepoEvent.parseCompare,
            'history': RepoEvent.parseHistory,
            "create": RepoEvent.createRepo,
            "edit": RepoEvent.parseEdit,
        },
    }
}
