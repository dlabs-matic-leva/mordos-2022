class WindowManager extends HTMLElement {
    /** @type {MutationObserver} */
    #observer

    constructor() {
        super();
        this.onHover = this.onHover.bind(this);
        this.onClick = this.onClick.bind(this);
    }

    #render() {
        const templates = document.createElement("div");
        templates.classList.add("templates")
        templates.attachShadow({mode: "open"}).innerHTML = `
<template id="template-row">
    <div class="row">
        <div class="row-split-before"></div>
        <div class="row-split-after"></div>
        <div class="row-split-indicator"></div>
    </div>
</template>
<template id="template-column">
    <div class="column">
        <div class="column-actions">
            <button class="column-home">🏠</button>
            <button class="column-close">❌</button>
        </div>
    </div>
</template>
<template id="template-row-controls">
    <div class="row-add-before"></div>
    <div class="row-add-after"></div>
    <div class="row-add-indicator"></div>
</template>
`;
        this.append(templates);
        this.#attachRowControls();

        const rowEl = this.#rowTemplate;
        const columnEl = this.#columnTemplate;
        const el = document.createElement("os-desktop");
        columnEl.append(el);
        rowEl.append(columnEl);
        this.append(rowEl);
    }

    get #rowTemplate() {
        return this
            .querySelector(".templates").shadowRoot
            .querySelector("#template-row").content.cloneNode(true)
            .querySelector(".row");
    }

    get #columnTemplate() {
        return this
            .querySelector(".templates").shadowRoot
            .querySelector("#template-column").content.cloneNode(true)
            .querySelector(".column");
    }

    connectedCallback() {
        this.#observer = new MutationObserver(() => {
            this.dataset.numOfApps = this.querySelectorAll(".column").length.toString();
        })
        this.#observer.observe(this, { childList: true, subtree: true });
        this.#render();
        this.addEventListener("mousemove", this.onHover)
        this.addEventListener("click", this.onClick)
    }

    disconnectedCallback() {
        this.removeEventListener("mousemove", this.onHover)
        this.removeEventListener("click", this.onClick)
        this.#observer.disconnect();
    }

    #attachRowControls() {
        const els = this
            .querySelector(".templates").shadowRoot
            .querySelector("#template-row-controls").content.cloneNode(true);
        this.append(els);
    }

    #addRow(ratio) {
        const rows = [...this.querySelectorAll(".row")];
        const index = Math.round((rows.length - 1) * ratio)

        const rowEl = this.#rowTemplate;
        const columnEl = this.#columnTemplate;
        columnEl.append(document.createElement("os-desktop"))
        rowEl.append(columnEl)
        rows[index].after(rowEl)
    }

    #splitRow(rowIndex, ratio) {
        const row = [...this.querySelectorAll(".row")][rowIndex];
        const columns = row.querySelectorAll(".column");
        const index = Math.round((columns.length - 1) * ratio)

        const columnEl = this.#columnTemplate;
        columnEl.append(document.createElement("os-desktop"));
        columns[index].after(columnEl);
    }

    #closeColumn(target) {
        if (this.dataset.numOfApps === "1") return;

        const column = this.#findClosesColumn(target);
        const row = column.closest(".row");
        if (row.querySelectorAll(".column").length === 1)
            row.remove()
        else
            column.remove();
    }

    #findClosesColumn(node, selector = ".column") {
        // https://stackoverflow.com/questions/54520554/custom-element-getrootnode-closest-function-crossing-multiple-parent-shadowd
        if (!node) {
            return null;
        }

        if (node instanceof ShadowRoot) {
            return this.#findClosesColumn(node.host, selector);
        }

        if (node instanceof HTMLElement) {
            if (node.matches(selector)) {
                return node;
            } else {
                return this.#findClosesColumn(node.parentNode, selector);
            }
        }

        return this.#findClosesColumn(node.parentNode, selector);

    }

    onHover(event) {
        if (event.target.classList.contains("row-add-before") || event.target.classList.contains("row-add-after")) {
            const indicator = event.target.parentElement.querySelector(".row-add-indicator");
            const {offsetY} = event;
            const ratio = offsetY / event.target.getBoundingClientRect().height;
            const rows = [...this.querySelectorAll(".row")];
            const index = Math.round((rows.length - 1) * ratio)
            const box = rows[index].getBoundingClientRect();
            indicator.style.top = `${box.y + box.height / 2}px`
        }

        if (event.target.classList.contains("row-split-before") || event.target.classList.contains("row-split-after")) {
            const indicator = event.target.parentElement.querySelector(".row-split-indicator");
            const {offsetX} = event;
            const ratio = offsetX / event.target.getBoundingClientRect().width;
            const row = event.target.parentElement;
            const columns = row.querySelectorAll(".column");
            const index = Math.round((columns.length - 1) * ratio)
            const box = columns[index].getBoundingClientRect();
            indicator.style.left = `${box.x + box.width / 2}px`
        }
    }

    onClick(event) {
        if (event.target.classList.contains("row-add-before") || event.target.classList.contains("row-add-after")) {
            const {offsetY} = event;
            const ratio = offsetY / event.target.getBoundingClientRect().height;
            this.#addRow(ratio)
        }

        if (event.target.classList.contains("row-split-before") || event.target.classList.contains("row-split-after")) {
            const {offsetX} = event;
            const ratio = offsetX / event.target.getBoundingClientRect().width;
            const rows = [...this.querySelectorAll(".row")]
            const rowIndex = rows.indexOf(event.target.parentElement);
            this.#splitRow(rowIndex, ratio)
        }

        if (event.target.classList.contains("column-close")) {
            this.#closeColumn(event.target)
        }

        if (event.target.classList.contains("column-home")) {
            this.openApp(event.target, "os-desktop")
        }
    }

    openApp(space, name, parameters) {
        const column = this.#findClosesColumn(space);
        const el = this.#columnTemplate;
        const app = document.createElement(name);
        el.append(app)
        if (parameters)
            parameters.split("&").forEach(param => {
                app.setAttribute(param.split("=")[0], param.split("=")[1]);
            })
        column.after(el);
        column.remove();
    }

    /**
     * @returns {WindowManager}
     */
    static get instance() {
        const instance = document.querySelector("os-window-manager");
        if (!instance) throw new Error("Missing <os-window-manager>! Include <os-window-manager> element anywhere on page.")
        return instance;
    }
}

customElements.define('os-window-manager', WindowManager);
