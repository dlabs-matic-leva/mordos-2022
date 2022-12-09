customElements.define('os-files', class extends HTMLElement {
    constructor() {
        super();
        this.onFilesChange = this.onFilesChange.bind(this);
        this.onListClick = this.onListClick.bind(this);
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
    
</div>
<template id="template-files-entry">
    <li class="files-entry">
        <!--suppress HtmlRequiredAltAttribute, RequiredAttributes -->
        <img class="files-preview">
        <span class="files-name"></span>
        <button class="files-delete">Delete</button>
        <button class="files-open">Open</button>
    </li>
</template>
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

    get #entryTemplate() {
        return this.shadowRoot.querySelector("#template-files-entry");
    }

    connectedCallback() {
        this.#render();
        this.onFilesChange();
        OsFiles.instance.addEventListener(OsFilesChanged.name, this.onFilesChange)
        this.#tags.addEventListener(OsTagsChanged.name, this.onFilesChange)
        this.#files.addEventListener("click", this.onListClick)
    }

    disconnectedCallback() {
        OsFiles.instance.removeEventListener(OsFilesChanged.name, this.onFilesChange)
        this.#tags.removeEventListener(OsTagsChanged.name, this.onFilesChange)
        this.#files.removeEventListener("click", this.onListClick)
    }

    onFilesChange() {

        const files = OsFiles.instance
            .files
            .filter(f => !this.#tags.selectedTags.length || f.tags.find(t => this.#tags.selectedTags.includes(t)));

        /**
         * @param {OsFile} file
         */
        const createFileEntry = (file) => {
            const entry = this.#entryTemplate.content.cloneNode(true);
            const preview = entry.querySelector(".files-preview");
            if (file.name.endsWith(".jpg")) {
                preview.src = file.contents;
                preview.alt = file.name;
            } else
                preview.remove();
            entry.querySelector(".files-entry").dataset.filename = file.name;
            entry.querySelector(".files-name").textContent = file.name;
            return entry;
        }
        [...this.#files.children].forEach(child => {
            if (!files.find(f => f.name === child.dataset.filename))
                child.remove();
        });
        for (let i = 0; i < files.length; i++) {
            const el = this.#files.querySelector(`.files-entry:nth-child(${i + 1})`);
            if (el && el.dataset.filename !== files[i].name) {
                el.before(createFileEntry(files[i]));
            } else if (!el) {
                this.#files.append(createFileEntry(files[i]))
            }
        }
    }

    onListClick(event) {
        if (event.target.classList.contains("files-delete")) {
            OsFiles.instance.deleteFile(event.target.parentElement.dataset.filename)
        }
        if (event.target.classList.contains("files-open")) {
            const filename = event.target.parentElement.dataset.filename;
            if (filename.endsWith(".txt"))
                WindowManager.instance.openApp(event.target, "os-notes", "filename=" + filename)
            if (filename.endsWith(".jpg"))
                WindowManager.instance.openApp(event.target, "os-gallery", "filename=" + filename)
        }
    }
});
