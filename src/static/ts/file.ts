class FileContainer {
    static listSel: HTMLSelectElement = e(`.class-files-body`)

    static click = () => {
        let self = this
        let listSel = self.listSel
        listSel.addEventListener('click', function(event){
            let target = event.target as HTMLSelectElement
            if (target.className.includes("a-files-td-name")) {
                log("click file path", target.dataset.path, target.dataset.type)
                let path = target.dataset.path
                let type = target.dataset.type
                let username = currentUsername()
                let repoName = currentRepoName()
                let form: RequestRepoSuffix = {
                    type: type
                }
                APIContainer.repoSuffix(username, repoName, `${path}`, form, function (r) {
                    let response = JSON.parse(r)
                    log("response:", response.data)
                    let res: ResponserRepoSuffix = response.data
                    if (type === EnumFileType.dir) {
                        RepoContainer.parseRepoDir(res.entries)
                    } else {
                        RepoContainer.parseRepoFile(path, res.content)
                    }
                })
            }
        })
    }
}
