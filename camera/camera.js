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
@keyframes shotTaken {
 from {
    border: 0 solid var(--white);
    transform: scale(1);
 }
 20% {
    border: 10px solid var(--white);
    transform: scale(1);
 }
 80% {
    border: 10px solid var(--white);
    transform: scale(0.98);
 }
 to {
    border: 0 solid var(--white);
    transform: scale(1);
 }
}
.camera-preview {
    width: 100%;
    height: 100%;
    overflow: hidden;
    object-fit: contain;
    pointer-events: none;
}
.camera-preview.shot-taken {
    box-sizing: border-box;
    animation: 200ms shotTaken;
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
    
    /* When video is animated, it would clip above button. Use z-index to solve this. */
    z-index: 1;
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

    #animateShot() {
        const preview = this.#preview;
        preview.classList.add("shot-taken");
        const animation = preview.getAnimations()[0];

        function removeClass() {
            preview.classList.remove("shot-taken");
            animation.removeEventListener("finish", removeClass);
        }

        animation.addEventListener("finish", removeClass);
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
        if (!this.#stream) return;

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
        OsFiles.instance.saveFile({name: name + ".jpg", contents: result.toDataURL("image/jpeg"), tags: ["image"]});
        this.#animateShot();
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
