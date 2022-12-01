customElements.define('os-window', class Files extends HTMLElement {
    constructor() {
        super();
        this.mouseDown = this.mouseDown.bind(this);
        this.mouseMove = this.mouseMove.bind(this);
        this.mouseUp = this.mouseUp.bind(this);
    }

    #render() {
        this.attachShadow({mode: 'open'}).innerHTML = `
<style>
.window {
    --border: var(--primary);
    --padding: var(--spacing);
    
    position: absolute;
    display: grid;
    grid-auto-columns: min-content;
    
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: calc(var(--spacing) / 2);
}
.window-title {
    grid-column: 1 / 2;
    grid-row: 1 / 2;
    
    font-size: 1.5rem;
    font-weight: bold;
    color: var(--primary);
    white-space: nowrap;
    
    margin: 0;
    padding: var(--padding);
    border-bottom: 1px solid var(--border);
    
    cursor: pointer;
    user-select: none;
}
.window-content {
    grid-column: 1 / 2;
    grid-row: 2 / 3;
}
</style>
<div class="window">
<div class="window-title">
<slot name="title"></slot>
</div>
<div class="window-content">
<slot></slot>
</div>
</div>
`;
    }

    get #window() {
        return this.shadowRoot.querySelector(".window");
    }

    get #title() {
        return this.shadowRoot.querySelector(".window-title");
    }

    connectedCallback() {
        this.#render();
        this.#title.addEventListener("mousedown", this.mouseDown)
    }

    disconnectedCallback() {
        this.#title.removeEventListener("mousedown", this.mouseDown)
    }

    mouseDown() {
        window.addEventListener("mousemove", this.mouseMove)
        window.addEventListener("mouseup", this.mouseUp)
        this.#window.style.transform = this.#window.style.transform || "translate(0px, 0px)"
    }

    mouseMove({movementX, movementY}) {
        const [, x, y] = this.#window.style.transform.match(/translate\((-?\d+?)px, (-?\d+?)px\)/)
        this.#window.style.transform = `translate(${+x + +movementX}px, ${+y + +movementY}px)`
    }

    mouseUp() {
        window.removeEventListener("mousemove", this.mouseMove)
        window.removeEventListener("mouseup", this.mouseUp)
    }
});
