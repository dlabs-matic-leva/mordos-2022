customElements.define('os-file-preview', class extends HTMLElement {
    constructor() {
        super();
        this.onDragStart = this.onDragStart.bind(this);
        this.onContextMenu = this.onContextMenu.bind(this);
        this.onClick = this.onClick.bind(this);
    }

    #render() {
        this.attachShadow({mode: 'open'}).innerHTML = `
<style>
:host {
    display: flex;
    flex-direction: column;
    border-radius: var(--spacing);
    overflow: hidden;
    box-shadow: 0 0 2px var(--shadow);
    position: relative;
    cursor: pointer;
}
:host > * {
    flex: 1 1 100%;
}
.file-preview {
    width: 100%;
    aspect-ratio: 1 / 1;
}
.file-preview.image {
    object-fit: cover;
}
.file-preview.document {
    font-size: 8px;
    box-shadow: 0 2px 2px -2px var(--shadow);
    box-sizing: border-box;
    padding: var(--spacing);
    overflow: hidden;
}
.file-name {
    padding: var(--spacing);
    overflow: hidden;
    text-overflow: ellipsis;
}
.file-menu {
    position: absolute;
    padding: 0;
    margin: 0;
    list-style: none;
}
.file-menu li {
    
}
.file-menu.hidden {
    display: none
}
</style>
<span class="file-name"></span>
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
    }

    get #root() {
        if (!this.shadowRoot) return null;
        return this.shadowRoot;
    }

    connectedCallback() {
        this.#render();
        if (this.getAttribute("filename"))
            this.attributeChangedCallback("filename", null, this.getAttribute("filename"))
        this.#root.addEventListener("click", this.onClick)
        this.#root.addEventListener("dragstart", this.onDragStart)
        this.#root.addEventListener("contextmenu", this.onContextMenu)
    }

    disconnectedCallback() {
        this.#root.removeEventListener("click", this.onClick)
        this.#root.removeEventListener("dragstart", this.onDragStart)
        this.#root.removeEventListener("contextmenu", this.onContextMenu)
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
            template.innerHTML = `<div class="file-preview document">${file.contents}</div>`
        return template.content;
    }

    onDragStart(event) {
        const filename = this.getAttribute("filename");
        if (!filename) return;
        if (!event.target.classList.contains("file-preview") && !event.target.classList.contains("document"))
            return

        const file = OsFiles.instance.files.find(f => f.name === filename);
        event.dataTransfer.setData("text/html", file.contents);
    }

    onContextMenu(event) {
        const filename = this.getAttribute("filename");
        if (!filename) return;

        event.preventDefault();
        window.dispatchEvent(new OsFileContextMenuOpenEvent(filename, event));
    }

    onClick(event) {
        const filename = this.getAttribute("filename");
        if (!filename) return;

        if (filename.endsWith(".txt"))
            WindowManager.instance.openApp(event.target, "os-notes", "filename=" + filename)
        if (filename.endsWith(".jpg"))
            WindowManager.instance.openApp(event.target, "os-gallery", "filename=" + filename)
    }
});
