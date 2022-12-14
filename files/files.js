customElements.define('os-files', class extends HTMLElement {
    constructor() {
        super();
        this.onFilesChange = this.onFilesChange.bind(this);
    }

    #render() {
        this.attachShadow({mode: 'open'}).innerHTML = `
<style>
.files {
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-columns: 200px 1fr;
}
.files-list {
    list-style: none;
    margin: 0;
    padding: var(--spacing);
    display: grid;
    grid-template: min-content / repeat(5, minmax(0, 1fr));
    gap: calc(var(--spacing) * 2) var(--spacing);
    overflow: auto;
}
.files-list li {
    display: block;
}
.files-preview {
    max-width: calc(var(--spacing) * 2);
    max-height: calc(var(--spacing) * 2);
    object-fit: cover;
}
</style>
<div class="files">
<os-tags-panel></os-tags-panel>
<ul class="files-list"></ul> 
<os-file-context-menu></os-file-context-menu>
</div>
       `;
    }

    get #files() {
        return this.shadowRoot.querySelector(".files-list");
    }

    /**
     * @returns {OsTagsPanel}
     */
    get #tags() {
        return this.shadowRoot.querySelector("os-tags-panel");
    }

    connectedCallback() {
        this.#render();
        this.onFilesChange();
        OsFiles.instance.addEventListener(OsFilesChanged.name, this.onFilesChange)
        this.#tags.addEventListener(OsTagsChanged.name, this.onFilesChange)
    }

    disconnectedCallback() {
        OsFiles.instance.removeEventListener(OsFilesChanged.name, this.onFilesChange)
        this.#tags.removeEventListener(OsTagsChanged.name, this.onFilesChange)
    }

    onFilesChange() {

        const files = OsFiles.instance
            .files
            .filter(f => {
                if (this.#tags.selectedTags.includes("deleted") && !f.tags.includes("deleted"))
                    return false;
                if (!this.#tags.selectedTags.includes("deleted") && f.tags.includes("deleted"))
                    return false;
                if (!this.#tags.selectedTags.length)
                    return true;
                if (this.#tags.selectedTags.length === 1 && this.#tags.selectedTags[0] === "deleted")
                    return true;
                return f.tags.filter(t => t !== "deleted").find(t => this.#tags.selectedTags.includes(t));
            });

        /**
         * @param {OsFile} file
         */
        const createFileEntry = (file) => {
            const el = document.createElement("os-file-preview");
            el.setAttribute("filename", file.name);
            const li = document.createElement("li");
            li.append(el)
            return li;
        }
        [...this.#files.children].forEach(child => {
            if (!files.find(f => f.name === child.getAttribute("filename")))
                child.remove();
        });
        for (let i = 0; i < files.length; i++) {
            const el = this.#files.querySelector(`.files-entry:nth-child(${i + 1})`);
            if (el && el.getAttribute("filename") !== files[i].name) {
                el.before(createFileEntry(files[i]));
            } else if (!el) {
                this.#files.append(createFileEntry(files[i]))
            }
        }
    }
});
