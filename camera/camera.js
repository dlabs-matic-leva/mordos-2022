customElements.define('os-camera', class Files extends HTMLElement {
    constructor() {
        super();
        this.shot = this.shot.bind(this);
        this.start = this.start.bind(this);
    }

    #render() {
        this.attachShadow({mode: 'open'}).innerHTML = `
<style>
.camera {
    display: grid;
}
.camera > * {
    grid-column: 1 / 1;
    grid-row: 1 / 1;
}
.camera-preview {
    pointer-events: none;
}
.camera-permission {
    align-self: center;
    justify-self: center;
    padding: var(--padding);
    margin-bottom: calc(var(--spacing) * 8 + var(--padding));
}
.hidden {
    display: none;
}
.camera-button {
    align-self: end;
    justify-self: center;
    margin-bottom: var(--padding);
    
    width: calc(var(--spacing) * 8);
    height: calc(var(--spacing) * 8);
    border-radius: 50%;
    
    background: rgba(100%, 100%, 100%, 0.5);
    border: solid 1px var(--black);
}
</style>
<os-window>
<span slot="title">Camera</span>
<div class="camera">
    <video class="camera-preview" autoplay playsinline></video>
    <div class="camera-permission hidden">
        Camera needs your permission to access your hardware.
        <br>
        <button class="camera-grant-permission">Grant permission</button>
    </div>
    <button class="camera-button"></button>
</div>
</os-window>
       `;
    }

    get #button() {
        return this.shadowRoot.querySelector(".camera-button");
    }

    get #preview() {
        return this.shadowRoot.querySelector(".camera-preview");
    }

    get #permission() {
        return this.shadowRoot.querySelector(".camera-permission");
    }

    get #grantPermission() {
        return this.shadowRoot.querySelector(".camera-grant-permission");
    }

    connectedCallback() {
        this.#render();
        this.#button.addEventListener("click", this.shot)
        this.#grantPermission.addEventListener("click", this.start)
        this.checkAndStart();
    }

    disconnectedCallback() {
        this.#button.removeEventListener("click", this.shot)
        this.#grantPermission.removeEventListener("click", this.start)
    }

    shot() {
        const result = document.createElement("canvas")
        result.width = this.#preview.videoWidth;
        result.height = this.#preview.videoHeight;
        result.getContext("2d").drawImage(result, 0, 0);
        console.log(result.toDataURL("image/jpeg"));
        // TODO Save this to File system
    }

    checkAndStart() {
        navigator.permissions.query({name: "camera"}).then(({state}) => {
                if (state === "granted")
                    return this.start();
                this.#permission.classList.remove("hidden");
                if (state === "denied")
                    this.#grantPermission.classList.add("hidden");
            }
        );
    }

    start() {
        return navigator.mediaDevices
            .getUserMedia({video: {facingMode: "environment"}, audio: false})
            .then((stream) => {
                this.#permission.classList.add("hidden");
                this.#preview.srcObject = stream;
            })
    }


});
