import NetworkClient from "./networkClient.js";
import InputManager from "./inputManager.js";
import customEventHandler from "./customEventHandler.js";
import { Scene } from "../final/renderer.js";
import WindowManager from "../final/gameLogic/WindowManager.js";
import Zurg from "../final/gameLogic/zurg.js";
import Vector3 from "./vector3.js";

//client side prediction code
import {simulate, ClientCommandRing, getInputCommand, InputState}  from "./clientSidePrediction.js";

/** @class GameSession class to handle high level game functions such as world building */
export default class GameSession extends EventTarget {
    eventBus;
    /** @type {NetworkClient} */
    networkClient;
    /** @type {InputManager} */
    inputManager;
    /** @type {String} */
    uuid;
    /** @type {Scene} */
    scene;
    /** @type {Mesh} */
    camera;
    /** @type {String} */
    prefix;

    /** @type {Number} just tracks the tick since scene initialized */
    clientTick = 0;
    /** @param {NetworkClient} networkClient @param {InputManager} inputManager*/
    constructor(eventBus, networkClient, inputManager) {
        super();
        this._sessionId = Math.random().toString(16).slice(2);

        this._disposed = false;
        this._unsubs = [];
        this._netHandlers = [];

        this.eventBus = eventBus;
        this.networkClient = networkClient;
        this.inputManager = inputManager;
        this.inputManager.gameShell = this;
        this.scene = undefined;
        this.camera = undefined;
        this.modelPool = new Map();
        this.unusedModels = [];
        this.gunPool = [];
        this.zurgModels = [];
        this._connectedOnce = false;
        this._shootBound = false;
        this._inputValidate = false;
        this._rebuildBound = false;

        this.positionBuffer = [];
        this.positionBufferIndex = 0;

        //load zurg and durg functions
        this.loadDurgModel = undefined;
        this.loadZurgModel = undefined;

        this.windowManager = new WindowManager();
        this.windows = [];
        this.windowHealth = [75, 50, 25, 75, 100, 0, 0, 0, 0];

        this.MESHES = undefined;
        this._onShoot = () => {
            console.log("shooting");
            if (!this.MESHES) {
                return;
            }
            let directions = this.getDirectionalVectors(this.camera.Q.m);
            let result = raycastMeshesAABBAllHits(this.camera.getPosition(), directions.forward, 1000, this.MESHES);
            console.log(result);
            if (result.length > 0) {
                result.forEach((value) => {
                    if (value.mesh.metadata) {
                        console.log(value.mesh.metadata);
                        //this.eventBus.emit("game:hit", { name: value.mesh.name });
                        if (value.mesh.metadata.zid >-1) {
                            console.log("hit zombie " + value.mesh.metadata.zid);
                            //value.mesh.render = false; 
                            this.sendMessage("shoot", { zid: value.mesh.metadata.zid });
                        }

                    }
                });
            }
        };

        this._onRebuild = (event) => {
            console.log(event.detail.message);

            if (!this.windowManager.BOXES) {
                return;
            }
            //CHECK DISTANCE FROM EACH WINDOW
            var min_dist = Number.POSITIVE_INFINITY;
            var wid = -1;
            this.windowManager.BOXES.forEach(box => {
                const box_pos = box.getPosition(false);
                const cam_pos = this.camera.getPosition(false);
                const pos = { x: box_pos.x - cam_pos.x, y: box_pos.y - cam_pos.y, z: box_pos.z - cam_pos.z };
                const dist = Math.hypot(pos.x, pos.y, pos.z);
                if (min_dist > dist) {
                    wid = box.metadata.wid;
                    min_dist = dist;
                }
            });
            if (min_dist <= 5) {
                console.log("Hit w%s: %s", wid, min_dist);
                this.sendMessage("rebuild", { wid: wid });
            }
        }
        const onGeneric = (event) => {
            this.dispatchEvent(new CustomEvent(event.detail.event, { detail: event.detail.data }));
        };
        const onConnected = (event) => {
            this.uuid = event.detail.uuid;
            customEventHandler(this);
        };
        const onUUIDS = (event) => { };
        const onSnapshot = (event) => {
            // if disposed
            if (this._disposed) return;
            //make sure scene exists first
            if (!this.scene) {
                return;
            }
                let snapshot = event.detail.snapshot;
            let playerSnapshot = snapshot.playerSnapshot;
            let zurgSnapshot = snapshot.zurgSnapshot;
            let windowSnapshot = snapshot.windowSnapshot;
                //console.log(windowSnapshot);
                if (this.scene) {
                    

                    let currentUUIDs = [...this.modelPool.keys()];
                    
                    for (let i = 0; i < playerSnapshot.length; i++) {
                        let playerState = playerSnapshot[i];
                        if (playerState.clientId === this.uuid) {
                            //this.scene.setCameraPosition(playerState.position.x, playerState.position.y, playerState.position.z);
                        } 
                        else {
                        //case brand new uuid
                        let model = this.modelPool.get(playerState.clientId);

                        if (model === undefined) {
                            if (this.unusedModels.length > 0) {
                                model = this.unusedModels.pop();
                                //console.log("[GameSession] filling uuid map with " + playerState.clientId);
                                //console.log(model);
                                //model.setRotationRadians(playerState.rotation.x, playerState.rotation.y, playerState.rotation.z);
                                model.setRotationRadians(playerState.rotation.x, playerState.rotation.y, playerState.rotation.z);
                                model.setPosition(playerState.position.x, playerState.position.y, playerState.position.z);
                                this.modelPool.set(playerState.clientId, model);
                            }
                            else {
                                if (this.MESHES) {
                                    //load a new mesh in then re render on the next snapshot
                                    this.loadDurgModel().then((mesh) => {
                                        if (this._disposed) return;
                                        this.MESHES.push(mesh);
                                        this.unusedModels.push(mesh);
                                    }, (error) => {
                                        console.log(error);
                                    });
                                }
                            }
                        }
                        else{
                            model.setRotationRadians(playerState.rotation.x, playerState.rotation.y, playerState.rotation.z);
                            model.setPosition(playerState.position.x, playerState.position.y, playerState.position.z);
                            if(model.metadata){
                                    if(!model.metadata.armed){
                                        if(this.gunPool.length > 0){
                                            model.metadata.armed = true;
                                            model.metadata.gunModel = this.gunPool.pop();
                                            model.metadata.gunModel.setPosition(0, 1, 0);
                                            model.metadata.gunModel.setParent(model);
                                            
                                        }
                                    }
                                }
                        }
                            //remove index from current indexes since if it exists;
                            const index = currentUUIDs.indexOf(playerState.clientId);
                            if (index !== -1) {
                                currentUUIDs.splice(index, 1);
                            }
                    }

                }
                //if any uuids that existed before but are not in snapshot repurpose their models
                if (currentUUIDs.length !== 0) {
                    for (let i = 0; i < currentUUIDs.length; i++) {
                        let model = this.modelPool.get(currentUUIDs[i]);
                        model.setPosition(0, -5, 0);
                        if (model.metadata) {
                            model.metadata.armed = false;
                            if (model.metadata.gunModel) {
                                model.metadata.gunModel.setParent(null);
                                model.metadata.gunModel.setPosition(0, -10, 0);
                                this.gunPool.push(model.metadata.gunModel);
                            }
                        }
                        this.unusedModels.push(model);
                        this.modelPool.delete(currentUUIDs[i]);
                    }
                }

                //render zurg snapshot
                for (let i = 0; i < zurgSnapshot.length; i++) {
                    let snapshot = zurgSnapshot[i];
                    let zurgModel = this.zurgModels[snapshot.zid];
                    if (zurgModel) {
                        zurgModel.metadata.health = snapshot.health;
                        //console.log(zurgModel.metadata);

                        let currentPosition = zurgModel.getPosition();
                        let targetPosition = snapshot.targetPosition;

                        let direction = {
                            x: targetPosition.x - currentPosition.x,
                            z: targetPosition.z - currentPosition.z,
                            y: 0
                        };

                        let angle = (Math.atan2(direction.x, direction.z) * (180 / Math.PI));// radians
                        zurgModel.clearRotation();
                        zurgModel.turnY(-Math.atan2(direction.x, direction.z));

                        zurgModel.setPosition(snapshot.position.x, snapshot.position.y, snapshot.position.z);



                    }
                }

                for (let i = 0; i < windowSnapshot.length; i++) {
                    let snapshot = windowSnapshot[i];
                    this.windowHealth[snapshot.windowId] = snapshot.health;
                    //console.log(`[GameSession][${this._sessionId}] received window snapshot`);
                    if (this.windows.length > 0) {
                        if (snapshot.windowId == 5) {

                        }
                        let health = snapshot.health;
                        switch (health) {
                            case 75:
                                this.windows[snapshot.windowId].boards[0].render = false;
                                this.windows[snapshot.windowId].boards[1].render = true;
                                this.windows[snapshot.windowId].boards[2].render = true;
                                this.windows[snapshot.windowId].boards[3].render = true;
                                break;
                            case 50:
                                this.windows[snapshot.windowId].boards[0].render = false;
                                this.windows[snapshot.windowId].boards[1].render = false;
                                this.windows[snapshot.windowId].boards[2].render = true;
                                this.windows[snapshot.windowId].boards[3].render = true;
                                break;
                            case 25:
                                this.windows[snapshot.windowId].boards[0].render = false;
                                this.windows[snapshot.windowId].boards[1].render = false;
                                this.windows[snapshot.windowId].boards[2].render = false;
                                this.windows[snapshot.windowId].boards[3].render = true;
                                break;
                            case 0:
                                this.windows[snapshot.windowId].boards[0].render = false;
                                this.windows[snapshot.windowId].boards[1].render = false;
                                this.windows[snapshot.windowId].boards[2].render = false;
                                this.windows[snapshot.windowId].boards[3].render = false;
                                break;
                            case 100:
                                this.windows[snapshot.windowId].boards[0].render = true;
                                this.windows[snapshot.windowId].boards[1].render = true;
                                this.windows[snapshot.windowId].boards[2].render = true;
                                this.windows[snapshot.windowId].boards[3].render = true;
                                break;
                            default:
                                break;
                        }
                    }
                }
            }
        };





        this.networkClient.addEventListener(NetworkClient.EVENTS.GENERIC, onGeneric);
        this._netHandlers.push([NetworkClient.EVENTS.GENERIC, onGeneric]);

        this.networkClient.addEventListener(NetworkClient.EVENTS.CONNECTED, onConnected);
        this._netHandlers.push([NetworkClient.EVENTS.CONNECTED, onConnected]);

        this.networkClient.addEventListener(NetworkClient.EVENTS.UUIDS, onUUIDS);
        this._netHandlers.push([NetworkClient.EVENTS.UUIDS, onUUIDS]);

        this.networkClient.addEventListener(NetworkClient.EVENTS.SNAPSHOT, onSnapshot);
        this._netHandlers.push([NetworkClient.EVENTS.SNAPSHOT, onSnapshot]);

        

        const onSceneInitialized = (event) => {
            //check if disposed
            if (this._disposed) return;


            console.log(` ${this._sessionId} gameSession id initialized`);


            this.loadDurgModel = event.loadDurgModel;
            this.loadZurgModel = event.loadZurgModel;

            this.loadM1Garrand = event.loadM1Garrand;
            this.loadThompson = event.loadThompson;
            this.loadRifle = event.loadRifle;

            this.MESHES = event.meshes;
            this.scene = event.scene;

            const meshes = event.meshes;
            this.camera = event.camera;

            /*const TEST_ZURG = new Zurg(1);
            TEST_ZURG.makeBody().then(() => {
                if (this._disposed) return;

                TEST_ZURG.body.name = "test_zurg";

                console.log(TEST_ZURG.body.getRotationRadians());
                TEST_ZURG.body.setRotationRadians(0,90 * (Math.PI/180),0);
                console.log(TEST_ZURG.body.getRotationRadians());

                meshes.push(TEST_ZURG.body);

            }, (error) => { });*/

            


            this.windowManager.initialize().then((boards) => {
                if (this._disposed) return;
                console.log(` ${this._sessionId} gameSession window manager initialized`);
                for (let i = 0; i < boards.length / 4; i++) {
                    this.windows.push({
                        boards: [
                            boards[(i * 4) + 0],
                            boards[(i * 4) + 1],
                            boards[(i * 4) + 2],
                            boards[(i * 4) + 3]
                        ]
                    });
                }
                for (let i = 0; i < boards.length; i++) {
                    meshes.push(boards[i]);
                }
                this.windowManager.initialized = true;


            }, (error) => {
                console.log(error);
            });

            //fill zurg pool
            const MAX_ZURGS = 15;
            this.zurgModels = [];
            for (let i = 0; i < MAX_ZURGS; i++) {
                this.loadZurgModel().then((mesh) => {
                    if (this._disposed) return;
                    console.log(this.zurgModels.length);
                    let index = this.zurgModels.push(mesh)-1;
                    console.log("index" + index+" length: "+this.zurgModels.length);
                    mesh.name = "zurg" + index;
                    mesh.metadata = {
                        zid: index,
                        health: -1
                    };
                    console.log(mesh.metadata.zid);
                    meshes.push(mesh);
                }, (error) => { console.log(error) });
            }

            //fill pool
            for (let i = 0; i < 10; i++) {
                this.loadDurgModel().then((mesh) => {
                    if (this._disposed) return;

                    //let camCube = new Cube(true);
                    //camCube.scale(.25,.25,.25);
                    //camCube.setPosition(0,1,-1);
                    //camCube.setParent(mesh);
                    mesh.setPosition(0, -5, 0);
                    mesh.metadata = {
                        armed:false,
                        gunModel:null
                    };
                    meshes.push(mesh);
                    //meshes.push(camCube);
                    let index = this.unusedModels.push(mesh);
                    //console.log(`[GameSession][${this._sessionId}] generated new durg`);
                    console.log(this.unusedModels[index - 1]);
                }, (error) => {
                    console.log(error);
                });
            }

            for(let i =0;i<10;i++){
                this.loadM1Garrand().then((m1Mesh) => {
                    if (this._disposed) return;
                    m1Mesh.turnY(Math.PI / 180);
                    //m1Mesh.setPosition(.3, 1.5, -1.8);
                    m1Mesh.setPosition(-50 + (10*i), -20, 0);
                    //m1Mesh.setParent(camCube);
                    meshes.push(m1Mesh);
                    this.gunPool.push(m1Mesh);
                });
            }

            //hook up shoot event, then connect
            if (!this._shootBound) {
                this.addEventListener("shoot", this._onShoot);
                this._shootBound = true;
            }

            if (!this._rebuildBound) {
                this.addEventListener("rebuild", this._onRebuild);
                this._rebuildBound = true;
            }

            if(!this._inputValidate){
                this.addEventListener("INPUT_VALIDATE", this.onInputValidate);
                this._inputValidate = true;
            }
            //after scene is initialized, connect to server to start receiving game state
            if (!this._connectedOnce &&
                this.networkClient.state !== NetworkClient.STATES.CONNECTED &&
                this.networkClient.state !== NetworkClient.STATES.CONNECTING) {



                this.networkClient.connect("wss://cdn.flickshotpro.com/ws");
                this._connectedOnce = true;

            }
        };



        const unsubScene = this.eventBus.on("scene:initialized", onSceneInitialized);
        this._unsubs.push(unsubScene);
    }
    dispose() {
        console.error("DISPOSING " + this._sessionId);
        if (this._disposed) return;
        this._disposed = true;

        //remove shoot listener
        if (this._onShoot) {
            this.removeEventListener('shoot', this._onShoot);
            this._onShoot = false;
        }
        if(this._inputValidate){
            this.removeEventListener("INPUT_VALIDATE", this.onInputValidate);
            this._inputValidate = false;
        }

        // remove game event listeners
        for (const unsub of this._unsubs) { try { unsub(); } catch { } }

        // remove network listeners
        for (const [type, fn] of this._netHandlers) {
            try { this.networkClient.removeEventListener(type, fn); } catch { }
        }

        // disconnect socket
        try { this.networkClient.disconnect?.(); } catch { }
        try { this.networkClient.close?.(); } catch { }

        // drop references for GC
        this.scene = undefined;
        this.camera = undefined;
        this.modelPool?.clear?.();
        this.unusedModels = [];
        this.zurgModels = [];
        this.windows = [];
        this.MESHES = null;
        this.windowManager = null;
        this.loadDurgModel = undefined;
        this.loadZurgModel = undefined;
        this._netHandlers = [];
        this._unsubs = [];
        this.positionBuffer = [];
        this.positionBufferIndex = 0;
        this.gunPool = [];
        this.prefix = undefined;
    }
    updateWorld(snapshot) {

    }
    
    commandNumber = 0;
    clientCommandRing = new ClientCommandRing();
    lastSendCommand = -1;
    networkSendTick = 0;
    boolFirstCommandSent = false;
    onInputValidate(event){
        //console.log(event.detail.inputCommand.targetPosition);
        //console.log(event.detail.trueResult);

        let inputCommand = event.detail.inputCommand;
        this.clientCommandRing.confirmAcknowledge(inputCommand);

        let clientSideTargetPosition = event.detail.inputCommand.targetPosition;
        let truePosition = event.detail.trueResult;

        let matched = false;
        if(event.detail.inputCommand.targetPosition.x == event.detail.trueResult.x &&
            event.detail.inputCommand.targetPosition.y == event.detail.trueResult.y&&
            event.detail.inputCommand.targetPosition.z == event.detail.trueResult.z
        ){
            matched = true;
        }

        
        
        
        if(!matched){
            console.log("no match");
            let wrongCommand = this.clientCommandRing.get(inputCommand.commandNumber);
            console.log("start "+ this._sessionId);
            console.log(this.clientCommandRing.latestCommand);
            console.log(this.clientCommandRing.lastAcknowledgedCommand);
            console.log(inputCommand.commandNumber);
            console.log(wrongCommand);
            console.log("end "+ this._sessionId);
            /*wrongCommand.command.targetPosition.x = truePosition.x;
            wrongCommand.command.targetPosition.y = truePosition.y;
            wrongCommand.command.targetPosition.z = truePosition.z;

            for (let i = this.clientCommandRing.lastAcknowledgedCommand + 1; i <= this.clientCommandRing.latestCommand; i++) {
                const command1 = this.clientCommandRing.get(i-1);
                const command2 = this.clientCommandRing.get(i);
                if (!command2) break; // overwritten: too much time passed
                command2.command.startPosition = command1.command.targetPosition;
                command2.command.targetPosition = simulate(command2.command,command2.command.startPosition);
            }*/
        }
    }
    onFixedUpdate(tickRate) {
       

        if (this.networkClient.state === NetworkClient.STATES.CONNECTED) {

            //network send loop
            if (this.networkSendTick == 1) {
                if (!this.boolFirstCommandSent) {
                    //there are commands in the buffer
                    if (this.clientCommandRing.latestCommand !== -1) {
                        // a command was sent but not acknowledged
                        if (this.clientCommandRing.lastAcknowledgedCommand == -1) {

                        }
                    }
                }
                //send packets
                this.networkSendTick = 0;
            }
            this.networkSendTick += 1;

            if (this.camera) {
                //make sure camera exists
                let inputState = new InputState({
                    forward: this.inputManager.forward,
                    backward: this.inputManager.backward,
                    left: this.inputManager.left,
                    right: this.inputManager.right,
                    directionalVectors: this.getDirectionalVectors(this.camera.Q.m)
                });
                let startPosition = new Vector3();
                if (this.commandNumber == 0) {
                    startPosition.x = this.camera.getPosition(false).x;
                    startPosition.y = this.camera.getPosition(false).y;
                    startPosition.z = this.camera.getPosition(false).z;
                }
                else{
                    //THIS IS A REFERENCE
                    startPosition.x = this.clientCommandRing.get(this.commandNumber - 1).command.targetPosition.x;
                    startPosition.y = this.clientCommandRing.get(this.commandNumber - 1).command.targetPosition.y;
                    startPosition.z = this.clientCommandRing.get(this.commandNumber - 1).command.targetPosition.z;
                }

                let result = simulate(inputState, startPosition);

                let inputCommand = {
                    //commandNumber id and tick id
                    commandNumber: this.commandNumber,
                    clientTick: this.clientTick,
                    //input state
                    forward: inputState.forward,
                    backward: inputState.backward,
                    left: inputState.left,
                    right: inputState.right,
                    directionalVectors: inputState.directionalVectors,

                    //input validation extras
                    rotation: this.camera.getRotationRadians(),
                    startPosition: startPosition,
                    targetPosition: result
                };
                this.clientCommandRing.set(inputCommand);
                this.networkClient.sendInputState(inputCommand);
                this.commandNumber += 1;
                this.clientTick += 1;
                //console.log(this.clientCommandRing);
            }
        }
    }

    sendMessage(event, data) {
        if (this.networkClient.state === NetworkClient.STATES.CONNECTED) {
            this.networkClient.sendMessage(event, data);
        } else {
            console.warn("[GameSession] Can't send message event " + event.toString() + " NetworkClient not in connected state");
        }

    }
    onUpdate(deltaTime) {
    }
    startTime = Date.now();
    fixedTickAccumulator = 0;
    fixedTickRate = 1000 / 20;
    update() {
        let now = Date.now();
        let deltaTime = now - this.startTime;
        this.fixedTickAccumulator += deltaTime;
        while (this.fixedTickAccumulator >= this.fixedTickRate) {
            this.onFixedUpdate(this.fixedTickRate);
            this.fixedTickAccumulator -= this.fixedTickRate;
        }
        if(this.camera){
            if (this.commandNumber > 1){
                let command = this.clientCommandRing.get(this.commandNumber -1).command;
                let goal = Vector3.moveTowards(command.startPosition,command.targetPosition,this.fixedTickAccumulator/this.fixedTickRate);
                this.camera.setPosition(goal.x,goal.y,goal.z);
            }
        }
        this.startTime = now;
        this.onUpdate(deltaTime);
    }

    //helper
    getDirectionalVectors = (matrix) => {
        let forward = {
            x: -matrix[8],
            y: -matrix[9],
            z: -matrix[10]
        };
        let right = {
            x: matrix[0],
            y: matrix[1],
            z: matrix[2]
        };

        let up = {
            x: matrix[4],
            y: matrix[5],
            z: matrix[6]
        };
        return {
            forward: forward,
            right: right,
            up: up
        };
    }
    lerpVec3(a, b, t) {
        return {
            x: a.x + (b.x - a.x) * t,
            y: a.y + (b.y - a.y) * t,
            z: a.z + (b.z - a.z) * t
        };
    }
}
//BB = { x: { min: 0, max: 0 }, y: { min: 0, max: 0 }, z: { min: 0, max: 0 } };
function getAABB(body) {
    const { x, y, z } = body.getPosition();
    const BB = body.BB;

    return {
        min: {
            x: x + BB.x.min,
            y: y + BB.y.min,
            z: z + BB.z.min
        },
        max: {
            x: x + BB.x.max,
            y: y + BB.y.max,
            z: z + BB.z.max
        }
    };
}
// Returns ALL hits as an array of { index, distance }, sorted by distance ascending.
// Uses getAABB(mesh) to fetch each mesh's {min,max} box.
function raycastMeshesAABBAllHits(origin, direction, length, meshes) {
    const EPS = 1e-8;

    const mag = Math.hypot(direction.x, direction.y, direction.z);
    if (mag < EPS || length <= 0) return [];

    // Normalize so length/distance are in world units
    const dir = { x: direction.x / mag, y: direction.y / mag, z: direction.z / mag };

    const hits = [];
    for (let i = 0; i < meshes.length; i++) {
        const box = getAABB(meshes[i]);         // <-- uses your getAABB
        const t = rayIntersectsAABB(origin, dir, length, box);
        if (t !== null) hits.push({ index: i, distance: t, mesh: meshes[i] });
    }

    hits.sort((a, b) => a.distance - b.distance);
    return hits;
}

// Slab test: ray segment [0, maxDist] vs AABB returned by getAABB:
// box = { min:{x,y,z}, max:{x,y,z} }
// Returns tHit (number) if hit, otherwise null.
function rayIntersectsAABB(origin, dir, maxDist, box) {
    let tmin = 0;
    let tmax = maxDist;

    function slab(o, d, minB, maxB) {
        const EPS = 1e-8;

        // Parallel to axis: origin must be inside slab
        if (Math.abs(d) < EPS) {
            if (o < minB || o > maxB) return null;
            return { t1: -Infinity, t2: Infinity };
        }

        const invD = 1 / d;
        let t1 = (minB - o) * invD;
        let t2 = (maxB - o) * invD;
        if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
        return { t1, t2 };
    }

    const sx = slab(origin.x, dir.x, box.min.x, box.max.x);
    if (!sx) return null;
    tmin = Math.max(tmin, sx.t1);
    tmax = Math.min(tmax, sx.t2);
    if (tmax < tmin) return null;

    const sy = slab(origin.y, dir.y, box.min.y, box.max.y);
    if (!sy) return null;
    tmin = Math.max(tmin, sy.t1);
    tmax = Math.min(tmax, sy.t2);
    if (tmax < tmin) return null;

    const sz = slab(origin.z, dir.z, box.min.z, box.max.z);
    if (!sz) return null;
    tmin = Math.max(tmin, sz.t1);
    tmax = Math.min(tmax, sz.t2);
    if (tmax < tmin) return null;

    // Entire AABB interval is behind the ray start
    if (tmax < 0) return null;

    const tHit = Math.max(tmin, 0);
    return tHit <= maxDist ? tHit : null;
}