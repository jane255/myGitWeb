class FileContainer {
    static listSel: HTMLSelectElement = e(`.class-file-list`)

    static click = () => {
        let self = this
        let listSel = self.listSel
        listSel.addEventListener('click', function(event){
            let target = event.target as HTMLSelectElement
            if (target.className.includes("span-file-cell-body")) {
                log("click file path", target.dataset.path)

            }
        })
    }

}
