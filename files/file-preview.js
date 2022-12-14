customElements.define('os-file-preview', class extends HTMLElement {
    constructor() {
        super();
        this.onListClick = this.onListClick.bind(this);
    }
    #render() {
        this.attachShadow({mode: 'open'}).innerHTML = `
<style>
.file-preview {
    display: inline-block;
    vertical-align: bottom;
}
.file-preview.image {
    height: calc(var(--spacing) * 4);
}
.file-preview.document {
    height: calc(var(--spacing) * 4);
    width: calc(var(--spacing) * 6);
    border: 1px solid var(--black);
    font-size: 8px;
    overflow: hidden;
}
</style>
<div class="file">
    <span class="file-name"></span>
    <button class="file-delete">Delete</button>
    <button class="file-restore">Restore</button>
    <button class="file-open">Open</button>
</div>
       `;
    }

    /**
     * @param {OsFile} file
     */
    #update(file) {
        if (!this.#root) return;
        if (!file)
            file = {
                name: "",
                contents: "",
                tags: [],
            };
        [...this.#root.querySelectorAll(".file-preview")].forEach(child => child.remove());
        this.#root.querySelector(".file-name").before(this.#renderFile(file));
        this.#root.querySelector(".file-name").textContent = file.name;
        if(file.tags.includes("deleted"))
            this.#root.querySelector(".file-delete").remove();
        else
            this.#root.querySelector(".file-restore").remove();
    }

    get #root() {
        if (!this.shadowRoot) return null;
        return this.shadowRoot.querySelector(".file");
    }

    connectedCallback() {
        this.#render();
        if (this.getAttribute("filename"))
            this.attributeChangedCallback("filename", null, this.getAttribute("filename"))
        this.#root.addEventListener("click", this.onListClick)
    }

    disconnectedCallback() {
        this.#root.removeEventListener("click", this.onListClick)
    }

    static get observedAttributes() {
        return ["filename"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "filename" && this.#root) {
            const file = OsFiles.instance.files.find(f => f.name === newValue);
            this.#update(file);
        }
    }

    /**
     * @param {OsFile} file
     */
    #renderFile(file) {
        const template = document.createElement("template")
        if (file.name.endsWith(".jpg"))
            template.innerHTML = `<img src="${file.contents}" alt="${file.name}" class="file-preview image">`
        else if (file.name.endsWith(".txt"))
            template.innerHTML = `<span class="file-preview document">${file.contents}</span>`
        return template.content;
    }

    onListClick(event) {
        const filename = this.getAttribute("filename");
        if(!filename) return;

        if (event.target.classList.contains("file-delete")) {
            OsFiles.instance.deleteFile(filename)
        }
        if (event.target.classList.contains("file-restore")) {
            OsFiles.instance.restoreFile(filename)
        }
        if (event.target.classList.contains("file-open")) {
            if (filename.endsWith(".txt"))
                WindowManager.instance.openApp(event.target, "os-notes", "filename=" + filename)
            if (filename.endsWith(".jpg"))
                WindowManager.instance.openApp(event.target, "os-gallery", "filename=" + filename)
        }
    }
});
