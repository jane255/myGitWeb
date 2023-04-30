class RepoContainer {
    static input: string = 'class-input-add-repo'
    static inputSel: HTMLSelectElement = e(`.${this.input}`)
    //
    static repoListSel: HTMLSelectElement = e(`.class-repo-list`)
    static tableSel: HTMLSelectElement = e(`.class-files-table`)
    static headSel: HTMLSelectElement = e(`.class-files-head`)
    static bodySel: HTMLSelectElement = e(`.class-files-body`)

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
        self.showCurrentRepo(repoId, repoName)
        // 获取仓库信息
        let username = currentUsername()
        APIContainer.repo(username, repoName, {}, function (r) {
            let response = JSON.parse(r)
            let respRepoDetail: ResponseRepoDetail = response.data
            self.parseRepoTitle(respRepoDetail.clone_address)
            self.parseRepoDir(respRepoDetail.entries)
        })
    }

    static parseRepoFile = (content: string) => {
        this.clearBody()
        let t = `
            <div id="file-content" class="tab-size-8">
                \t<h4 class="ui top attached header" id="repo-read-file">
                \t\t
                \t\t\t<i class="octicon octicon-file-text ui left"></i>
                \t\t\t<strong>test1.txt</strong> <span class="text grey normal">1.1 KB</span>
                \t\t
                \t\t
                \t\t\t<div class="ui right file-actions">
                \t\t\t\t<div class="ui buttons">
                \t\t\t\t\t
                \t\t\t\t\t\t<a class="ui button" href="/haxi/gitWeb/src/b09c6c64d517aeba795b05b5015f0475424dd8cb/test/test1.txt">Permalink</a>
                \t\t\t\t\t
                \t\t\t\t\t<a class="ui button" href="/haxi/gitWeb/commits/master/test/test1.txt">History</a>
                \t\t\t\t\t<a class="ui button" href="/haxi/gitWeb/raw/master/test/test1.txt">Raw</a>
                \t\t\t\t</div>
                \t\t\t\t
                \t\t\t\t\t
                \t\t\t\t\t\t<a href="/haxi/gitWeb/_edit/master/test/test1.txt"><i class="octicon octicon-pencil btn-octicon poping up" data-content="Edit this file" data-position="bottom center" data-variation="tiny inverted"></i></a>
                \t\t\t\t\t
                \t\t\t\t\t
                \t\t\t\t\t\t<a href="/haxi/gitWeb/_delete/master/test/test1.txt"><i class="octicon octicon-trashcan btn-octicon btn-octicon-danger poping up" data-content="Delete this file" data-position="bottom center" data-variation="tiny inverted"></i></a>
                \t\t\t\t\t
                \t\t\t\t
                \t\t\t</div>
                \t\t
                \t</h4>
                \t<div class="ui unstackable attached table segment">
                \t\t<div id="" class="file-view code-view has-emoji">
                \t\t\t
                \t\t\t\t<table>
                \t\t\t\t\t<tbody>
                \t\t\t\t\t\t<tr>
                \t\t\t\t\t\t
                \t\t\t\t\t\t\t<td class="lines-num"><span id="L1">1</span><span id="L2">2</span><span id="L3">3</span><span id="L4">4</span><span id="L5">5</span><span id="L6">6</span><span id="L7">7</span><span id="L8">8</span><span id="L9">9</span><span id="L10">10</span><span id="L11">11</span><span id="L12">12</span><span id="L13">13</span><span id="L14">14</span><span id="L15">15</span><span id="L16">16</span><span id="L17">17</span><span id="L18">18</span><span id="L19">19</span><span id="L20">20</span><span id="L21">21</span><span id="L22">22</span><span id="L23">23</span><span id="L24">24</span><span id="L25">25</span><span id="L26">26</span><span id="L27">27</span><span id="L28">28</span></td>
                \t\t\t\t\t\t\t<td class="lines-code"><pre><code class="nohighlight"><ol class="linenums"><li class="L1" rel="L1"># 请求体</li>
                <li class="L2" rel="L2">GET http://git.oschina.net/kesin/getingblog.git/info/refs?service=git-upload-pack HTTP/1.1</li>
                <li class="L3" rel="L3">Host: git.oschina.net</li>
                <li class="L4" rel="L4">User-Agent: git/2.24.3 (Apple Git-128)</li>
                <li class="L5" rel="L5">Accept-Encoding: deflate, gzip</li>
                <li class="L6" rel="L6">Proxy-Connection: Keep-Alive</li>
                <li class="L7" rel="L7">Pragma: no-cache</li>
                <li class="L8" rel="L8"></li>
                <li class="L9" rel="L9"># Gitee 响应</li>
                <li class="L10" rel="L10">HTTP/1.1 200 OK</li>
                <li class="L11" rel="L11">Cache-Control: no-cache, max-age=0, must-revalidate</li>
                <li class="L12" rel="L12">Connection: keep-alive</li>
                <li class="L13" rel="L13">Content-Type: application/x-git-upload-pack-advertisement</li>
                <li class="L14" rel="L14">Expires: Fri, 01 Jan 1980 00:00:00 GMT</li>
                <li class="L15" rel="L15">Pragma: no-cache</li>
                <li class="L16" rel="L16">Server: nginx</li>
                <li class="L17" rel="L17">X-Frame-Options: DENY</li>
                <li class="L18" rel="L18">X-Gitee-Server: Brzox/3.2.3</li>
                <li class="L19" rel="L19">X-Request-Id: 96e0af82-dffe-4352-9fa5-92f652ed39c7</li>
                <li class="L20" rel="L20">Transfer-Encoding: chunked</li>
                <li class="L21" rel="L21"></li>
                <li class="L22" rel="L22">001e# service=git-upload-pack</li>
                <li class="L23" rel="L23">0000</li>
                <li class="L24" rel="L24">010fca6ce400113082241c1f45daa513fabacc66a20d HEADmulti_ack thin-pack side-band side-band-64k ofs-delta shallow deepen-since deepen-not deepen-relative no-progress include-tag multi_ack_detailed no-done symref=HEAD:refs/heads/testbody object-format=sha1 agent=git/2.29.2</li>
                <li class="L25" rel="L25">003c351bad7fdb498c9634442f0c3f60396e8b92f4fb refs/heads/dev</li>
                <li class="L26" rel="L26">004092ad3c48e627782980f82b0a8b05a1a5221d8b74 refs/heads/dev-pro</li>
                <li class="L27" rel="L27">0040ae747d0a0094af3d27ee86c33e645139728b2a9a refs/heads/develop</li>
                <li class="L28" rel="L28">0000</li>
                </ol></code></pre></td>
                \t\t\t\t\t\t
                \t\t\t\t\t\t</tr>
                \t\t\t\t\t</tbody>
                \t\t\t\t</table>
                \t\t\t
                \t\t</div>
                \t</div>
                </div>
        `
        for (let c of content.split('\n')) {

        }
    }

    static parseRepoDir = (entries: []) => {
        this.clearBody()
        let fileBodySel = e(`.class-files-body`)
        for (let entry of entries) {
            let e = entry as ResponseRepoDetailFile | ResponseRepoDetailDir
            let t: string
            if (e.type == EnumFileType.dir) {
                t = `
                     <tr class="class-files-tr tr-dir">
                        <td class="class-files-td-icon">
                            <img class="img-files-td-icon" src="/static/img/icon/folder.png">
                        </td>
                `
            } else {
                t = `
                     <tr class="class-files-tr tr-file">
                        <td class="class-files-td-icon">
                            <img class="img-files-td-icon" src="/static/img/icon/file.png">
                        </td>
                `
            }
            t += `
                        <td class="class-files-td-name">
                            <a class="a-files-td-name" data-path="${e.path}" data-type="${e.type}">${e.name}</a>
                        </td>
                        <td class="class-files-td-hash">
                            <a>${e.hash_code }</a>
                        </td>
                        <td class="class-files-td-commit">
                            <a>${e.commit_message }</a>
                        </td>
                        <td class="class-files-td-date">
                            <a>${e.commit_time }</a>
                        </td>
                    </tr>
            `
            appendHtml(fileBodySel, t)
        }
    }

    static clearBody = () => {
        this.bodySel.replaceChildren()
    }

    static parseRepoTitle = (clone_address: string) => {
        let sel = e(`.class-item-clone`)
        sel.innerText = clone_address
    }

    static showCurrentRepo = (repoId: number, repoName: string) => {
        let s = `current-repo`
        let currentRepoSel = e(`.${s}`)
        if (currentRepoSel !== null) {
            currentRepoSel.className = 'class-repo-name'
        }
        let idRepoSel = e(`#class-repo-id-${repoId.toString()}`)
        idRepoSel.className += ' ' + s
        //
        let body = e(`.class-repo-body`)
        body.dataset.repo = repoName
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
