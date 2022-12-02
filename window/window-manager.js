class WindowManager extends HTMLElement {
    constructor() {
        super();
        this.onHover = this.onHover.bind(this);
        this.onClick = this.onClick.bind(this);
    }

    #activeApps = [["os-camera", "os-files"], ["os-desktop"]]

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
        <button class="column-close">X</button>
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
        this.#updateWindows();
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
        this.#render();
        this.addEventListener("mousemove", this.onHover)
        this.addEventListener("click", this.onClick)
    }

    disconnectedCallback() {
        this.removeEventListener("mousemove", this.onHover)
        this.removeEventListener("click", this.onClick)
    }

    #attachRowControls() {
        const els = this
            .querySelector(".templates").shadowRoot
            .querySelector("#template-row-controls").content.cloneNode(true);
        this.append(els);
    }

    #updateWindows() {
        // TODO do partial update
        [...this.querySelectorAll(".row")].forEach(c => c.remove());
        this.#activeApps.forEach((row, rowIndex) => {
            const rowEl = this.#rowTemplate;
            rowEl.dataset.rowIndex = rowIndex.toString();
            row.forEach((app, columnIndex) => {
                const columnEl = this.#columnTemplate;
                const a = document.createElement(app);
                if (app === "os-desktop") {
                    a.setAttribute("row", rowIndex.toString());
                    a.setAttribute("column", columnIndex.toString());
                }
                columnEl.append(a)
                const close = columnEl.querySelector(".column-close");
                close.dataset.rowIndex = rowIndex.toString();
                close.dataset.columnIndex = columnIndex.toString();
                rowEl.append(columnEl)
            })
            this.append(rowEl);
        });
    }

    #splitRow(index, ratio) {
        this.#activeApps[index].splice(Math.round(this.#activeApps[index].length * ratio), 0, "os-desktop")
        this.#updateWindows();
    }

    #addRow(ratio) {
        this.#activeApps.splice(Math.round(this.#activeApps.length * ratio), 0, ["os-desktop"])
        this.#updateWindows();
    }

    #closeColumn(rowIndex, columnIndex) {
        this.#activeApps[rowIndex].splice(columnIndex, 1)
        this.#activeApps = this.#activeApps.filter(row => row.length > 0);
        this.#updateWindows();
    }

    onHover(event) {
        if (event.target.classList.contains("row-add-before") || event.target.classList.contains("row-add-after")) {
            const indicator = event.target.parentElement.querySelector(".row-add-indicator");
            const {offsetY: y} = event;
            indicator.style.transform = `translate(0, ${y}px)`
        }

        if (event.target.classList.contains("row-split-before") || event.target.classList.contains("row-split-after")) {
            const indicator = event.target.parentElement.querySelector(".row-split-indicator");
            const {offsetX: x} = event;
            indicator.style.transform = `translate(${x}px, 0)`
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
            const rowIndex = +event.target.parentElement.dataset.rowIndex;
            this.#splitRow(rowIndex, ratio)
        }

        if (event.target.classList.contains("column-close")) {
            const rowIndex = +event.target.dataset.rowIndex;
            const columnIndex = +event.target.dataset.columnIndex;
            this.#closeColumn(rowIndex, columnIndex)
        }
    }

    openApp(name, row, column) {
        if (this.#activeApps[row][column] !== "os-desktop") {
            throw new Error("There's no empty slot at this index!")
        }
        this.#activeApps[row][column] = name;
        this.#updateWindows();
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
