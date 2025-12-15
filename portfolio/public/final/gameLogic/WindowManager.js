const WINDOW_NAMES = ['w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7', 'w8', 'w9']; //Window names
class WindowManager {
    WINDOWS = new Map();
    constructor(prefix) {
        this.prefix = prefix;
    }

    async initialize() {
        const PATH = '/final/models/windows/';
        const MESHES = new Array(WINDOW_NAMES.length * 4);
        for (let i = 0; i < WINDOW_NAMES.length; i++) {
            const WINDOW = WINDOW_NAMES[i];
            for (let BOARD = 0; BOARD < 4; BOARD++) {
                const NAME = WINDOW + '_' + BOARD + '.ply';
                let data = await Parser.importMesh(PATH, NAME, true);
                MESHES[i*4 + BOARD] = new Mesh(data, false, false, 8, i);
                this.WINDOWS.set(NAME, MESHES[i*4 + BOARD]);
            }
        }
        return MESHES;
    }

    hideWindow(name) {
        const WINDOW = this.WINDOWS.get(name);
        if (WINDOW) {
            WINDOW.render = false;
        } else {
            console.warn("Invalid Window name: %s", name);
        }
    }

    showWindow(name) {
        const WINDOW = this.WINDOWS.get(name);
        if (WINDOW) {
            WINDOW.render = true;
        } else {
            console.warn("Invalid Window name: %s", name);
        }
    }
}