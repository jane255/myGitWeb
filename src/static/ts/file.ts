class FileContainer {
    static listSel: HTMLSelectElement = e(`.class-files-tboody`)

    static bindEvent = () => {
        let self = this
        let listSel = self.listSel
        listSel.addEventListener('click', function(event){
            let target = event.target as HTMLSelectElement
            if (target.className.includes("a-files-path-name")) {
                log("click file path", target.dataset.path, target.dataset.type)
                let path = target.dataset.path
                let type = target.dataset.type
                let form = {
                    type: type
                }
                APIContainer.repoSuffix(`${path}`, form, function (r) {
                    let response = JSON.parse(r)
                    log("response:", response.data)
                    let res: ResponserRepoSuffix = response.data
                    if (type === EnumFileType.dir) {
                        RepoContainer.parseFilesSuffixBody(res.entries, res.path)
                    } else {
                        RepoContainer.parseFile(path, res.content)
                    }
                })
            }
        })
    }
}
