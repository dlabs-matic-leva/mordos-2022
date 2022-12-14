class OsTagsChanged extends CustomEvent {
    constructor() {
        super(OsTagsChanged.name);
    }

    static name = "os-tags-changed";
}

class OsTagsPanel extends HTMLElement {
    #selectedTags = [];
    get selectedTags() {
        return this.#selectedTags.slice()
    }

    constructor() {
        super();
        this.onFilesChange = this.onFilesChange.bind(this);
        this.onTagClick = this.onTagClick.bind(this);
    }

    #render() {
        this.attachShadow({mode: 'open'}).innerHTML = `
<style>
:host {
    box-shadow: 0 0 2px var(--shadow);
}
.tags {
    list-style: none;
    margin: 0;
    padding: var(--spacing);
}
.tag-entry {
    width: min-content;
    --size: calc(var(--spacing) * 3);
    line-height: var(--size);
    padding: 0 calc(var(--spacing) * 2) 0 calc(var(--spacing) * 2);
    position: relative;
    --color: red;
    border: 1px solid var(--color);
    border-radius: var(--spacing);
    cursor: pointer;
}
.tag-entry.selected {
    background: var(--color)
}
.tag-entry + .tag-entry {
    margin-top: var(--spacing);
}
.tag-entry::before {
    content: "";
    display: block;
    position: absolute;
    background: var(--surface);
    height: 4px;
    width: 4px;
    top: calc(50% - 2px);
    left: calc(var(--spacing) - 2px);
    border-radius: 50%;
}
.tag-name {
    pointer-events: none;
}
</style>
<ul class="tags"></ul>
<template id="template-tag-entry">
    <li class="tag-entry" role="button" tabindex="0" >
        <span class="tag-name"></span>
    </li>
</template>
       `;
    }

    get #tags() {
        return this.shadowRoot.querySelector(".tags");
    }

    get #template() {
        return this.shadowRoot.querySelector("#template-tag-entry");
    }

    connectedCallback() {
        this.#render();
        this.onFilesChange();
        OsFiles.instance.addEventListener(OsFilesChanged.name, this.onFilesChange)
        this.#tags.addEventListener("click", this.onTagClick)
    }

    disconnectedCallback() {
        OsFiles.instance.removeEventListener(OsFilesChanged.name, this.onFilesChange)
        this.#tags.removeEventListener("click", this.onTagClick)
    }

    onFilesChange() {

        const tags = [
            ...OsFiles.instance.files
                .flatMap(file => file.tags)
                .filter((tag, index, arr) => arr.indexOf(tag) === index)
                .filter(t => t !== "deleted"),
            "deleted"];

        const createTagEntry = (tag) => {
            const entry = this.#template.content.cloneNode(true);
            const hash = tag.split("").reduce((sum, c) => sum + c.codePointAt(0), 0) % 400;
            entry.querySelector(".tag-entry").style.setProperty("--color", `hsl(${hash}grad, 60%, 50%)`);
            entry.querySelector(".tag-entry").dataset.tag = tag;
            if (this.#selectedTags.includes(tag))
                entry.querySelector(".tag-entry").classList.add("selected")
            entry.querySelector(".tag-name").textContent = tag;
            return entry;
        }
        [...this.#tags.children].forEach(child => {
            if (!tags.includes(child.dataset.tag))
                child.remove();
        });
        for (let i = 0; i < tags.length; i++) {
            const el = this.#tags.querySelector(`.tag-entry:nth-child(${i + 1})`);
            if (el && el.dataset.tag !== tags[i]) {
                el.before(createTagEntry(tags[i]));
            } else if (!el) {
                this.#tags.append(createTagEntry(tags[i]))
            } else {
                if (this.#selectedTags.includes(tags[i]))
                    el.classList.add("selected")
                else
                    el.classList.remove("selected")
            }
        }
    }

    onTagClick(event) {
        if (event.target.classList.contains("tag-entry")) {
            if (this.#selectedTags.includes(event.target.dataset.tag)) {
                this.#selectedTags = this.#selectedTags.filter(tag => tag !== event.target.dataset.tag);
            } else {
                this.#selectedTags = [...this.#selectedTags, event.target.dataset.tag];
            }
            this.onFilesChange();
            this.dispatchEvent(new OsTagsChanged())
        }
    }

}

customElements.define('os-tags-panel', OsTagsPanel);
