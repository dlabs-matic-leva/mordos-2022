customElements.define('os-desktop', class extends HTMLElement {
    constructor() {
        super();
        this.onClick = this.onClick.bind(this);
    }

    #apps = [["os-camera", "📷"], ["os-files", "📁"], ["os-notes", "📝"]];

    #render() {
        this.attachShadow({mode: 'open'}).innerHTML = `
<style>
:host {
    position: relative;
    overflow: hidden;
}
.app-background {
    position: absolute;
    margin: -20px;
    width: calc(100% + 40px);
    height: calc(100% + 40px);
    filter: blur(10px);
    z-index: -1;
}
@media (prefers-color-scheme: dark) {
    .app-background {
        background: url(/window/devin-kaselnak-kEuew3XMeEA-unsplash.jpg) center / cover no-repeat;
    }    
}

@media (prefers-color-scheme: light) {
    .app-background {
        background: url(/window/martin-bennie-oJxoDn1NfZQ-unsplash.jpg) center / cover no-repeat;
    }     
}

.app-list {
    margin: 0;
    padding: 0;
    list-style: none;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: calc(var(--spacing) * 2);
}
.app-icon {
    width: calc(var(--spacing) * 10);
    height: calc(var(--spacing) * 10);
    border-radius: var(--spacing);
    border: 0;
    background: var(--shadow);
    box-shadow: 0 0 2px var(--shadow);
    box-sizing: border-box;
    font-size: calc(var(--spacing) * 6);
    line-height: calc(var(--spacing) * 10);
    text-align: center;
}
</style>
<div class="app-background"></div>
<ul class="app-list"></ul>
<template id="template-app-entry">
    <li class="app-entry">
        <button class="app-icon"></button>
    </li>
</template>
       `;

        this.#apps.forEach(([app, icon]) => {
            const entry = this.#entryTemplate.content.cloneNode(true);
            entry.querySelector(".app-icon").textContent = icon;
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
        if (!event.target.classList.contains("app-icon")) return;

        WindowManager.instance.openApp(this, event.target.parentElement.dataset.name);
    }
});
