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

    /**
     *
     * @param {MediaStream} stream
     * @param {((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => void)[]} filters
     * @return MediaStream
     */
    #injectFilters(stream, filters) {
        // https://developer.chrome.com/articles/mediastreamtrack-insertable-media-processing/
        if (!('MediaStreamTrackProcessor' in window && 'MediaStreamTrackGenerator' in window)) return stream;

        const videoTrack = stream.getVideoTracks()[0];
        const trackProcessor = new MediaStreamTrackProcessor({track: videoTrack});
        const trackGenerator = new MediaStreamTrackGenerator({kind: 'video'});

        const canvas = new OffscreenCanvas(1, 1);
        const ctx = canvas.getContext('2d', {alpha: false, desynchronized: true});

        const transformer = new TransformStream({
            async transform(frame, controller) {
                if (!canvas || !ctx) {
                    frame.close();
                    return;
                }


                const width = frame.displayWidth;
                const height = frame.displayHeight;
                canvas.width = width;
                canvas.height = height;

                ctx.drawImage(frame, 0, 0);
                for (const filter of filters)
                    filter(ctx, canvas);
                frame.close();

                // alpha: 'discard' is needed in order to send frames to a PeerConnection.
                controller.enqueue(new VideoFrame(canvas, {timestamp: frame.timestamp, alpha: 'discard'}));

            },
        });
        trackProcessor.readable.pipeThrough(transformer).pipeTo(trackGenerator.writable);
        return new MediaStream([trackGenerator]);
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     * @param {HTMLCanvasElement} canvas
     */
    #filterSepia(ctx, canvas) {
        // https://dzone.com/articles/html5-image-effects-sepia
        const r = [0, 0, 0, 1, 1, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 7, 7, 7, 7, 8, 8, 8, 9, 9, 9, 9, 10, 10, 10, 10, 11, 11, 12, 12, 12, 12, 13, 13, 13, 14, 14, 15, 15, 16, 16, 17, 17, 17, 18, 19, 19, 20, 21, 22, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 39, 40, 41, 42, 44, 45, 47, 48, 49, 52, 54, 55, 57, 59, 60, 62, 65, 67, 69, 70, 72, 74, 77, 79, 81, 83, 86, 88, 90, 92, 94, 97, 99, 101, 103, 107, 109, 111, 112, 116, 118, 120, 124, 126, 127, 129, 133, 135, 136, 140, 142, 143, 145, 149, 150, 152, 155, 157, 159, 162, 163, 165, 167, 170, 171, 173, 176, 177, 178, 180, 183, 184, 185, 188, 189, 190, 192, 194, 195, 196, 198, 200, 201, 202, 203, 204, 206, 207, 208, 209, 211, 212, 213, 214, 215, 216, 218, 219, 219, 220, 221, 222, 223, 224, 225, 226, 227, 227, 228, 229, 229, 230, 231, 232, 232, 233, 234, 234, 235, 236, 236, 237, 238, 238, 239, 239, 240, 241, 241, 242, 242, 243, 244, 244, 245, 245, 245, 246, 247, 247, 248, 248, 249, 249, 249, 250, 251, 251, 252, 252, 252, 253, 254, 254, 254, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255],
            g = [0, 0, 1, 2, 2, 3, 5, 5, 6, 7, 8, 8, 10, 11, 11, 12, 13, 15, 15, 16, 17, 18, 18, 19, 21, 22, 22, 23, 24, 26, 26, 27, 28, 29, 31, 31, 32, 33, 34, 35, 35, 37, 38, 39, 40, 41, 43, 44, 44, 45, 46, 47, 48, 50, 51, 52, 53, 54, 56, 57, 58, 59, 60, 61, 63, 64, 65, 66, 67, 68, 69, 71, 72, 73, 74, 75, 76, 77, 79, 80, 81, 83, 84, 85, 86, 88, 89, 90, 92, 93, 94, 95, 96, 97, 100, 101, 102, 103, 105, 106, 107, 108, 109, 111, 113, 114, 115, 117, 118, 119, 120, 122, 123, 124, 126, 127, 128, 129, 131, 132, 133, 135, 136, 137, 138, 140, 141, 142, 144, 145, 146, 148, 149, 150, 151, 153, 154, 155, 157, 158, 159, 160, 162, 163, 164, 166, 167, 168, 169, 171, 172, 173, 174, 175, 176, 177, 178, 179, 181, 182, 183, 184, 186, 186, 187, 188, 189, 190, 192, 193, 194, 195, 195, 196, 197, 199, 200, 201, 202, 202, 203, 204, 205, 206, 207, 208, 208, 209, 210, 211, 212, 213, 214, 214, 215, 216, 217, 218, 219, 219, 220, 221, 222, 223, 223, 224, 225, 226, 226, 227, 228, 228, 229, 230, 231, 232, 232, 232, 233, 234, 235, 235, 236, 236, 237, 238, 238, 239, 239, 240, 240, 241, 242, 242, 242, 243, 244, 245, 245, 246, 246, 247, 247, 248, 249, 249, 249, 250, 251, 251, 252, 252, 252, 253, 254, 255],
            b = [53, 53, 53, 54, 54, 54, 55, 55, 55, 56, 57, 57, 57, 58, 58, 58, 59, 59, 59, 60, 61, 61, 61, 62, 62, 63, 63, 63, 64, 65, 65, 65, 66, 66, 67, 67, 67, 68, 69, 69, 69, 70, 70, 71, 71, 72, 73, 73, 73, 74, 74, 75, 75, 76, 77, 77, 78, 78, 79, 79, 80, 81, 81, 82, 82, 83, 83, 84, 85, 85, 86, 86, 87, 87, 88, 89, 89, 90, 90, 91, 91, 93, 93, 94, 94, 95, 95, 96, 97, 98, 98, 99, 99, 100, 101, 102, 102, 103, 104, 105, 105, 106, 106, 107, 108, 109, 109, 110, 111, 111, 112, 113, 114, 114, 115, 116, 117, 117, 118, 119, 119, 121, 121, 122, 122, 123, 124, 125, 126, 126, 127, 128, 129, 129, 130, 131, 132, 132, 133, 134, 134, 135, 136, 137, 137, 138, 139, 140, 140, 141, 142, 142, 143, 144, 145, 145, 146, 146, 148, 148, 149, 149, 150, 151, 152, 152, 153, 153, 154, 155, 156, 156, 157, 157, 158, 159, 160, 160, 161, 161, 162, 162, 163, 164, 164, 165, 165, 166, 166, 167, 168, 168, 169, 169, 170, 170, 171, 172, 172, 173, 173, 174, 174, 175, 176, 176, 177, 177, 177, 178, 178, 179, 180, 180, 181, 181, 181, 182, 182, 183, 184, 184, 184, 185, 185, 186, 186, 186, 187, 188, 188, 188, 189, 189, 189, 190, 190, 191, 191, 192, 192, 193, 193, 193, 194, 194, 194, 195, 196, 196, 196, 197, 197, 197, 198, 199];

        const noise = 20;
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < imageData.data.length; i += 4) {

            imageData.data[i] = r[imageData.data[i]];
            imageData.data[i + 1] = g[imageData.data[i + 1]];
            imageData.data[i + 2] = b[imageData.data[i + 2]];

            const currentNoise = Math.round(noise - Math.random() * noise);

            for (let j = 0; j < 3; j++) {
                let iPN = currentNoise + imageData.data[i + j];
                imageData.data[i + j] = (iPN > 255) ? 255 : iPN;
            }
        }

        ctx.putImageData(imageData, 0, 0);
    }

    start() {
        return navigator.mediaDevices
            .getUserMedia({video: {facingMode: "environment"}, audio: false})
            .then((stream) => {
                stream = this.#injectFilters(stream, [this.#filterSepia])

                this.#stream = stream;
                this.#permission.classList.add("hidden");
                this.#preview.srcObject = stream;
            })
    }
});
