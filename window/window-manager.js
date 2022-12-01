customElements.define('os-window-manager', class extends HTMLElement {
    #activeApps = ["os-camera"]


    #render() {
        this.#activeApps.forEach(app => this.append(document.createElement(app)));
    }

    connectedCallback() {
        this.#render();
    }
});
