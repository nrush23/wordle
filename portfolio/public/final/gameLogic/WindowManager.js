const WINDOW_NAMES = ['w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7', 'w8', 'w9']; //Window names
const BOX_NAMES = ['wb1', 'wb2', 'wb3', 'wb4', 'wb5', 'wb6', 'wb7', 'wb8', 'wb9']; //Hit Box Names
export default class WindowManager {
    WINDOWS = new Map();
    BOXES = new Array(BOX_NAMES.length);
    constructor(prefix) {
        this.prefix = prefix;
        this.initialized = false;
    }

    async initialize() {
        //Import the windows
        const PATH = '/final/models/windows/';
        const MESHES = new Array(WINDOW_NAMES.length * 4 + BOX_NAMES.length);
        for (let i = 0; i < WINDOW_NAMES.length; i++) {
            const WINDOW = WINDOW_NAMES[i];
            for (let BOARD = 0; BOARD < 4; BOARD++) {
                const NAME = WINDOW + '_' + BOARD;
                const index = i * 4 + BOARD;
                let data = await Parser.importMesh(PATH, NAME + '.ply', true);
                MESHES[index] = new Mesh(data, false, false, 8, 0);
                this.WINDOWS.set(NAME, MESHES[index]);
            }
        }
        const BOX_PATH = '/final/models/window_boxes/';
        const index = WINDOW_NAMES.length * 4;
        //Import the window boxes
        for (let i = 0; i < BOX_NAMES.length; i++) {
            const NAME = BOX_NAMES[i];
            let data = await Parser.importMesh(BOX_PATH, NAME + '.ply', true);
            let box = new Mesh(data, false, false, 8, -1);
            box.metadata = {wid: i+1};
            box.name = "w" + i+1;
            // box.render = false;
            MESHES[index + i] = box;
            this.BOXES[i] = box;
            console.log(MESHES[index + i]);
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

    changeRandomWindow() {
        const NAME = WINDOW_NAMES[Math.floor(Math.random() * WINDOW_NAMES.length)];
        const BOARD = Math.floor(Math.random() * 4);
        const WINDOW = this.WINDOWS.get(NAME + '_' + BOARD);
        WINDOW.render = !WINDOW.render;
        console.log(NAME + '_' + BOARD + '.ply');
    }
    changeWindow(index) {
        const NAME = WINDOW_NAMES[index];
        for (let i = 0; i < 4; i++) {
            const BOARD = this.WINDOWS.get(NAME + '_' + i);
            BOARD.render = !BOARD.render;
        }
    }
    renderWindowSnapshot(windowSnapshot) {
        if (!this.initialized) return;

        if (!this.WINDOWS.size == 36) return;

        for (let i = 0; i < windowSnapshot.length; i++) {
            let snapshot = windowSnapshot[i];
            let windowId = snapshot.windowId;
            let health = snapshot.health;
            let NAME = WINDOW_NAMES[windowId];


            if (health <= 100 && health > 75) {
                for (let i = 0; i < 4; i++) {
                    let BOARD = this.WINDOWS.get(NAME + '_' + i);
                    BOARD.render = true;
                }
            }
            else if (health <= 75 && health > 50) {
                for (let i = 0; i < 4; i++) {
                    let BOARD = this.WINDOWS.get(NAME + '_' + i);
                    BOARD.render = (i >= 1);
                }
            }
            else if (health <= 50 && health > 25) {
                for (let i = 0; i < 4; i++) {
                    let BOARD = this.WINDOWS.get(NAME + '_' + i);
                    BOARD.render = (i >= 2);
                }
            }
            else if (health <= 25 && health > 0) {
                for (let i = 0; i < 4; i++) {
                    let BOARD = this.WINDOWS.get(NAME + '_' + i);
                    BOARD.render = (i >= 3);
                }
            }
            else if (health == 0) {
                for (let i = 0; i < 4; i++) {
                    let BOARD = this.WINDOWS.get(NAME + '_' + i);
                    BOARD.render = false;
                }
            }
        }



    }
}
