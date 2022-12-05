customElements.define('os-camera', class extends HTMLElement {
    constructor() {
        super();
        this.shot = this.shot.bind(this);
        this.start = this.start.bind(this);
    }

    /**
     * @type MediaStream | null
     */
    #stream = null;

    #render() {
        this.attachShadow({mode: 'open'}).innerHTML = `
<style>
:host {
    display: grid;
    background: black;
}
.camera-preview , .camera-permission, .camera-button{
    grid-column: 1 / 1;
    grid-row: 1 / 1;
}
.camera-preview {
    width: 100%;
    height: 100%;
    overflow: hidden;
    object-fit: contain;
    pointer-events: none;
}
.camera-permission {
    place-self: center;
    padding: var(--spacing);
    margin-bottom: calc(var(--spacing) * 8 + var(--spacing));
}
.hidden {
    display: none;
}
.camera-button {
    align-self: end;
    justify-self: center;
    margin-bottom: var(--spacing);
    
    width: calc(var(--spacing) * 8);
    height: calc(var(--spacing) * 8);
    border-radius: 50%;
    
    background: rgba(100%, 100%, 100%, 0.5);
    border: solid 1px var(--black);
}
</style>
<video class="camera-preview" autoplay playsinline></video>
<div class="camera-permission hidden">
    Camera needs your permission to access your hardware.
    <br>
    <button class="camera-grant-permission">Grant permission</button>
</div>
<button class="camera-button"></button>
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
        if (this.#stream) {
            this.#stream.getTracks().forEach(track => track.stop());
        }
        this.#button.removeEventListener("click", this.shot)
        this.#grantPermission.removeEventListener("click", this.start)
    }

    shot() {
        const result = document.createElement("canvas")
        result.width = this.#preview.videoWidth;
        result.height = this.#preview.videoHeight;
        result.getContext("2d").drawImage(this.#preview, 0, 0);
        const now = new Date();
        const name = now.getUTCFullYear() +
            now.getUTCDate().toString().padStart(2, "0") +
            (now.getUTCMonth() + 1).toString().padStart(2, "0") +
            now.getUTCHours().toString().padStart(2, "0") +
            now.getUTCMinutes().toString().padStart(2, "0") + "_" +
            now.valueOf();
        OsFiles.instance.saveFile({name: name + ".jpg", contents: result.toDataURL("image/jpeg")});
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
                this.#stream = stream;
                this.#permission.classList.add("hidden");
                this.#preview.srcObject = stream;
            })
    }
});
