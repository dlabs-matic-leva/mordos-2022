customElements.define('os-desktop', class extends HTMLElement {
    constructor() {
        super();
        this.onClick = this.onClick.bind(this);
    }

    #apps = ["os-camera", "os-files"];

    #render() {
        this.attachShadow({mode: 'open'}).innerHTML = `
<ul class="app-list"></ul>
<template id="template-app-entry">
    <li class="app-entry">
        <button class="app-name"></button>
    </li>
</template>
       `;

        this.#apps.forEach(app => {
            const entry = this.#entryTemplate.content.cloneNode(true);
            entry.querySelector(".app-name").textContent = app;
            entry.querySelector(".app-entry").dataset.name = app;
            this.#list.append(entry);
        })
    }

    get #list() {
        return this.shadowRoot.querySelector(".app-list");
    }

    get #entryTemplate() {
        return this.shadowRoot.querySelector("#template-app-entry");
    }

    connectedCallback() {
        this.#render();
        this.#list.addEventListener("click", this.onClick);
    }

    disconnectedCallback() {
        this.#list.removeEventListener("click", this.onClick);
    }

    onClick(event) {
        if (!event.target.classList.contains("app-name")) return;

        WindowManager.instance.openApp(this, event.target.parentElement.dataset.name);
    }
});
