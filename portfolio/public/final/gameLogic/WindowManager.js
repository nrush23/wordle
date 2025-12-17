const WINDOW_NAMES = ['w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7', 'w8', 'w9']; //Window names
export default class WindowManager {
    WINDOWS = new Map();
    constructor(prefix) {
        this.prefix = prefix;
        this.initialized = false;
    }

    async initialize() {
        const PATH = '/final/models/windows/';
        const MESHES = new Array(WINDOW_NAMES.length * 4);
        for (let i = 0; i < WINDOW_NAMES.length; i++) {
            const WINDOW = WINDOW_NAMES[i];
            for (let BOARD = 0; BOARD < 4; BOARD++) {
                const NAME = WINDOW + '_' + BOARD;
                let data = await Parser.importMesh(PATH, NAME + '.ply', true);
                MESHES[i*4 + BOARD] = new Mesh(data, false, false, 8, 0);
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

    changeRandomWindow(){
        const NAME = WINDOW_NAMES[Math.floor(Math.random() * WINDOW_NAMES.length)];
        const BOARD = Math.floor(Math.random() * 4);
        const WINDOW = this.WINDOWS.get(NAME + '_' + BOARD);
        WINDOW.render = !WINDOW.render;
        console.log(NAME + '_' + BOARD + '.ply');
    }
    changeWindow(index){
        const NAME = WINDOW_NAMES[index];
        for(let i = 0 ; i < 4;i++){
            const BOARD = this.WINDOWS.get(NAME + '_' + i + '.ply');
            BOARD.render = !BOARD.render;
        }
    }
    renderWindowSnapshot(windowSnapshot) {
        if (!this.initialized) return;

        if(!this.WINDOWS.size == 36) return;

        for (let i = 0; i < windowSnapshot.length; i++) {
            let snapshot = windowSnapshot[i];
            let windowId = snapshot.windowId;
            let health = snapshot.health;
            
            
            
            if (health <= 100 && health > 75){
                let name = WINDOW_NAMES[windowId];
                for (let i = 0; i < 4; i++) {
                    let BOARD = this.WINDOWS.get(name + '_' + i + '.ply');
                    BOARD.render = true;
                }
            }
            else if (health<=75 && health >50){
                let name = WINDOW_NAMES[windowId];
                for (let i = 0; i < 4; i++) {
                    let BOARD = this.WINDOWS.get(name + '_' + i + '.ply');
                    if(i<1){
                        BOARD.render = false
                    }
                    else{
                        BOARD.render = true;
                    }
                }
            }
            else if (health<=50 && health >25){
                let name = WINDOW_NAMES[windowId];
                for (let i = 0; i < 4; i++) {
                    let BOARD = this.WINDOWS.get(name + '_' + i + '.ply');
                    if(i<2){
                        BOARD.render = false
                    }
                    else{
                        BOARD.render = true;
                    }
                }
            }
            else if (health<=25 && health >0){
                let name = WINDOW_NAMES[windowId];
                for (let i = 0; i < 4; i++) {
                    let BOARD = this.WINDOWS.get(name + '_' + i + '.ply');
                    if(i<3){
                        BOARD.render = false
                    }
                    else{
                        BOARD.render = true;
                    }
                }
            }
            else if (health == 0) {
                let name = WINDOW_NAMES[windowId];
                for (let i = 0; i < 4; i++) {
                    let BOARD = this.WINDOWS.get(name + '_' + i + '.ply');
                    BOARD.render = false;
                }
            }
        }
        


    }
}
/*
if (health <= 100 && health > 75) {
    for (let i = 0; i < 4; i++) {
        const BOARD = this.WINDOWS.get(NAME + '_' + i + '.ply');
        BOARD.render = true;
    }
}
else if (health <= 75 && health > 50) {
    for (let i = 0; i < 4; i++) {
        const BOARD = this.WINDOWS.get(NAME + '_' + i + '.ply');
        if (i < 1) {
            BOARD.render = false;
        }
        else {

            BOARD.render = true;
        }
    }
}
else if (health <= 50 && health > 25) {
    for (let i = 0; i < 4; i++) {
        const BOARD = this.WINDOWS.get(NAME + '_' + i + '.ply');
        if (i < 2) {
            BOARD.render = false;
        }
        else {

            BOARD.render = true;
        }
    }
}
else if (health <= 25 && health > 0) {
    for (let i = 0; i < 4; i++) {
        const BOARD = this.WINDOWS.get(NAME + '_' + i + '.ply');
        if (i < 3) {
            BOARD.render = false;
        }
        else {

            BOARD.render = true;
        }
    }
}
else {
    for (let i = 0; i < 4; i++) {
        const BOARD = this.WINDOWS.get(NAME + '_' + i + '.ply');
        BOARD.render = false;
    }
}
    */