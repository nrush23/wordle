export default class AudioManager {
    constructor() {
        //START AUDIO
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        // The listener is "you" (usually your camera)
        const listener = audioCtx.listener;

        // The sound source will be spatialized by this
        const panner = audioCtx.createPanner();
        panner.panningModel = "HRTF";        // best for headphones
        panner.distanceModel = "inverse";    // common attenuation model
        panner.refDistance = 1;              // distance at which gain is 1.0
        panner.maxDistance = 1000;
        panner.rolloffFactor = 1;            // how quickly it fades with distance
        panner.coneInnerAngle = 360;         // make it omni-directional
        panner.coneOuterAngle = 360;
        panner.coneOuterGain = 0;

        // Route panner -> speakers
        panner.connect(audioCtx.destination);

        async function loadAudioBuffer(url) {
            const res = await fetch(url);
            const arrayBuffer = await res.arrayBuffer();
            return await audioCtx.decodeAudioData(arrayBuffer);
        }
        function setListenerPosition(x, y, z) {
            if (listener.positionX) {
                listener.positionX.value = x;
                listener.positionY.value = y;
                listener.positionZ.value = z;
            } else if (listener.setPosition) {
                listener.setPosition(x, y, z);
            }
        }
        function setNodePosition3D(node, x, y, z) {
            // Works across modern browsers (AudioParam based)
            if (node.positionX) {
                node.positionX.value = x;
                node.positionY.value = y;
                node.positionZ.value = z;
            } else if (node.setPosition) {
                // Older API
                node.setPosition(x, y, z);
            }

        }
        let buffer;

        async function init() {
            buffer = await loadAudioBuffer("https://cdn.flickshotpro.com/audio/Marilyn Manson - Sweet Dreams (Are Made Of This) (Alt. Version).mp3");

            // Place the source at (0, 0, 0)
            setNodePosition3D(panner, 0, 0, 0);

            // Place listener 10 units away on Z axis
            setListenerPosition(0, 0, 10);
        }

        function play() {
            // On many browsers, this must happen after a user gesture
            if (audioCtx.state !== "running") audioCtx.resume();

            const source = audioCtx.createBufferSource();
            source.buffer = buffer;
            source.loop = false;

            // source -> panner -> destination
            source.connect(panner);

            source.start();

        }

        // Example usage:
        /*init().then(()=>{
            play();
        });*/
        //END AUDIO
    }
}