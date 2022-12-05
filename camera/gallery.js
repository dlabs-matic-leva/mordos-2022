customElements.define('os-gallery', class extends HTMLElement {
    #render() {
        this.attachShadow({mode: 'open'}).innerHTML = `
<style>
:host {
    display: grid;
    background: black;
}
.gallery-preview {
    width: 100%;
    height: 100%;
    overflow: hidden;
    object-fit: contain;
    pointer-events: none;
}
</style>
<!--suppress HtmlRequiredAltAttribute, RequiredAttributes -->
<img class="gallery-preview">
`;
    }

    get #preview() {
        if (!this.shadowRoot) return null;
        return this.shadowRoot.querySelector(".gallery-preview");
    }

    connectedCallback() {
        this.#render();
        if (this.getAttribute("filename"))
            this.attributeChangedCallback("filename", null, this.getAttribute("filename"))
    }

    static get observedAttributes() {
        return ["filename"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "filename" && this.#preview) {
            this.#preview.src = OsFiles.instance.files.find(f => f.name === newValue).contents;
        }
    }
});
