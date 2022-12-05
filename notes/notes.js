customElements.define("os-notes", class extends HTMLElement {
    constructor() {
        super();
        this.onChange = this.onChange.bind(this);
    }

    #render() {
        this.attachShadow({mode: "open"}).innerHTML = `
<style>
.notepad {
    width: 100%;
    height: 100%;
    padding: var(--spacing);
    box-sizing: border-box;
}
</style>
<div class="notepad" contenteditable></div>
`
    }

    get #notepad() {
        if (!this.shadowRoot) return null;
        return this.shadowRoot.querySelector(".notepad");
    }

    connectedCallback() {
        this.#render();
        if (this.getAttribute("filename"))
            this.attributeChangedCallback("filename", null, this.getAttribute("filename"))
        this.#moveCaretToEnd();
        this.#notepad.focus();
        this.#notepad.addEventListener("input", this.onChange)
    }

    disconnectedCallback() {
        this.#notepad.removeEventListener("input", this.onChange)
    }

    static get observedAttributes() {
        return ["filename"];
    }

    #moveCaretToEnd() {
        const range = document.createRange();
        range.selectNodeContents(this.#notepad);
        range.collapse(false);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);


    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "filename" && this.#notepad) {
            const newHtml = OsFiles.instance.files.find(f => f.name === newValue).contents;
            if (newHtml !== this.#notepad.innerHTML)
                this.#notepad.innerHTML = newHtml;
        }
    }

    onChange() {
        const text = this.#notepad.innerHTML;
        const now = new Date();
        const title = now.valueOf() + ".txt";

        const filename = this.getAttribute("filename") || title;
        OsFiles.instance.saveFile({name: filename, contents: text});
        if (!this.getAttribute("filename")) {
            this.setAttribute("filename", filename);
        }
    }
});
