class OsFilesChanged extends CustomEvent {
    constructor() {
        super(OsFilesChanged.name);
    }

    static name = "os-files-changed";
}

/**
 * @typedef {{name: string, contents: string, tags?: string[]}} OsFile
 */

class OsFiles extends HTMLElement {
    /**
     * @type OsFile[]
     */
    #files = []

    /**
     * @type OsFile[]
     */
    get files() {
        return this.#files;
    }

    /**
     * @param {OsFile} file
     */
    saveFile(file) {
        this.#files = this.#files.filter(f => f.name !== file.name).concat(file);
        this.dispatchEvent(new OsFilesChanged())
    }

    /**
     * @param {string} name
     */
    deleteFile(name) {
        this.#files.splice(this.#files.findIndex(f => f.name === name), 1);
        this.dispatchEvent(new OsFilesChanged())
    }

    /**
     * @type OsFiles
     */
    static get instance() {
        const instance = document.querySelector("os-file-system");
        if (!instance) throw new Error("Missing <os-file-system>! Include <os-file-system> element anywhere on page.")
        return instance;
    }
}

customElements.define('os-file-system', OsFiles);
