class OsFileContextMenuOpenEvent extends CustomEvent {
    /**
     * @param {string} filename
     * @param {PointerEvent} pointerEvent
     */
    constructor(filename, pointerEvent) {
        super(OsFileContextMenuOpenEvent.name, {
            detail: {
                filename,
                pointerEvent,
            },
        });
    }

    static name = "os-file-context-menu-open";
}

customElements.define('os-file-context-menu', class extends HTMLElement {
    constructor() {
        super();
        this.onOpen = this.onOpen.bind(this);
        this.onClick = this.onClick.bind(this);
        this.onContextAction = this.onContextAction.bind(this);
    }

    #render() {
        this.attachShadow({mode: 'open'}).innerHTML = `
<style>
:host {
    position: fixed;
}
.file-menu {
    padding: 0;
    margin: 0;
    list-style: none;
}
.file-menu.hidden {
    display: none
}

.file-menu:not(.deleted-file) .file-restore {
    display: none;
}
.file-menu.deleted-file .file-delete {
    display: none;
}
</style>
<menu class="file-menu hidden">
    <li><button class="file-delete">Delete</button></li>
    <li><button class="file-restore">Restore</button></li>
</menu>

       `;
    }

    connectedCallback() {
        this.#render();
        window.addEventListener(OsFileContextMenuOpenEvent.name, this.onOpen)
        this.shadowRoot.addEventListener("click", this.onContextAction)
        window.addEventListener("click", this.onClick)
    }

    disconnectedCallback() {
        window.removeEventListener(OsFileContextMenuOpenEvent.name, this.onOpen)
        this.shadowRoot.removeEventListener("click", this.onContextAction)
        window.removeEventListener("click", this.onClick)
    }

    onOpen({detail: {filename, pointerEvent}}) {
        const menu = this.shadowRoot.querySelector(".file-menu");
        const rect = this.shadowRoot.host.getBoundingClientRect();
        menu.classList.remove("hidden");
        menu.style.transform = `translate(${pointerEvent.x - rect.x}px, ${pointerEvent.y - rect.y}px)`
        menu.dataset.filename = filename;
        const file = OsFiles.instance.files.find(f => f.name === filename);
        if (file.tags.includes("deleted"))
            menu.classList.add("deleted-file")
        else
            menu.classList.remove("deleted-file")
    }

    onClose() {
        const menu = this.shadowRoot.querySelector(".file-menu");
        menu.classList.add("hidden");
    }

    onClick() {
        this.onClose();
    }

    onContextAction(event) {
        const menu = this.shadowRoot.querySelector(".file-menu");
        const filename = menu.dataset.filename;
        if (!filename) return;

        if (event.target.classList.contains("file-delete")) {
            OsFiles.instance.deleteFile(filename)
        }
        if (event.target.classList.contains("file-restore")) {
            OsFiles.instance.restoreFile(filename)
        }
    }
});
