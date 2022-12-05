customElements.define('os-files', class extends HTMLElement {
    constructor() {
        super();
        this.onFilesChange = this.onFilesChange.bind(this);
        this.onListClick = this.onListClick.bind(this);
    }

    #render() {
        this.attachShadow({mode: 'open'}).innerHTML = `
<style>
.files-preview {
    max-width: calc(var(--spacing) * 2);
    max-height: calc(var(--spacing) * 2);
    object-fit: cover;
}
</style>
<h1>Files</h1>
<ul class="files-list"></ul>
<template id="template-files-entry">
    <li class="files-entry">
        <img class="files-preview">
        <span class="files-name"></span>
        <button class="files-delete">Delete</button>
        <button class="files-open">Open</button>
    </li>
</template>
       `;
    }

    get #files() {
        return OsFiles.instance;
    }

    get #list() {
        return this.shadowRoot.querySelector(".files-list");
    }

    get #entryTemplate() {
        return this.shadowRoot.querySelector("#template-files-entry");
    }

    connectedCallback() {
        this.#render();
        this.onFilesChange();
        this.#files.addEventListener(OsFilesChanged.name, this.onFilesChange)
        this.#list.addEventListener("click", this.onListClick)
    }

    disconnectedCallback() {
        this.#files.removeEventListener(OsFilesChanged.name, this.onFilesChange)
        this.#list.removeEventListener("click", this.onListClick)
    }

    onFilesChange() {
        // TODO do partial update
        [...this.#list.children].forEach(child => {
            this.#list.removeChild(child);
        });
        this.#files.files.forEach(file => {
            const entry = this.#entryTemplate.content.cloneNode(true);
            const preview = entry.querySelector(".files-preview");
            if (file.name.endsWith(".jpg")) {
                preview.src = file.contents;
                preview.alt = file.name;
            } else
                preview.remove();
            entry.querySelector(".files-entry").dataset.filename = file.name;
            entry.querySelector(".files-name").textContent = file.name;
            this.#list.append(entry);
        })
    }

    onListClick(event) {
        if (event.target.classList.contains("files-delete")) {
            this.#files.deleteFile(event.target.parentElement.dataset.filename)
        }
        if (event.target.classList.contains("files-open")) {
            WindowManager.instance.openApp(event.target, "os-notes", "filename=" + event.target.parentElement.dataset.filename)
        }
    }

});
