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
    #key = "file-system";

    /**
     * @returns OsFile[]
     */
    get #files() {
        return JSON.parse(localStorage.getItem(this.#key) || "[]");
    }

    /**
     * @param {OsFile[]} value
     */
    set #files(value) {
        localStorage.setItem(this.#key, JSON.stringify(value));
    }

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
        if (this.#files.find(f => f.name === file.name))
            this.#files = this.#files.map(f => f.name !== file.name ? f : file);
        else
            this.#files = this.#files.concat(file);
        this.dispatchEvent(new OsFilesChanged())
    }

    /**
     * @param {string} name
     */
    deleteFile(name) {
        this.#files = this.#files.map(f => {
            if (f.name !== name) return f;

            return {
                ...f,
                tags: f.tags.concat("deleted").filter((t, i, arr) => arr.indexOf(t) === i)
            }
        });
        this.dispatchEvent(new OsFilesChanged())
    }

    /**
     * @param {string} name
     */
    restoreFile(name) {
        this.#files = this.#files.map(f => {
            if (f.name !== name) return f;

            return {
                ...f,
                tags: f.tags.filter(t => t !== "deleted")
            }
        });
        this.dispatchEvent(new OsFilesChanged())
    }

    /**
     * @returns {OsFiles}
     */
    static get instance() {
        const instance = document.querySelector("os-file-system");
        if (!instance) throw new Error("Missing <os-file-system>! Include <os-file-system> element anywhere on page.")
        return instance;
    }
}

customElements.define('os-file-system', OsFiles);
