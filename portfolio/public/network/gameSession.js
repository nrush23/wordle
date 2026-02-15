import NetworkClient from "./networkClient.js";
import InputManager from "./inputManager.js";
import customEventHandler from "./customEventHandler.js";
import { Scene } from "../final/renderer.js";
import WindowManager from "../final/gameLogic/WindowManager.js";
import Zurg from "../final/gameLogic/zurg.js";
import Vector3 from "./vector3.js";

import Parser from "./ReactWebGl/parser.js";

// client side prediction code
import { simulate, ClientCommandRing, getInputCommand, InputState, ClientInputBuffer, InputCommand } from "./clientSidePrediction.js";

// Extracted Systems
import SnapshotSystem from "./Systems/SnapshotSystem.js";
import InputSystem from "./Systems/InputSystem.js";
import PredictionSystem from "./Systems/PredictionSystem.js";

// Extracted Utilities
import { getDirectionalVectors, lerpVec3 } from "./Utils/MathUtils.js";
import { raycastMeshesAABBAllHits } from "./Utils/Raycast.js";

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

        // Initialize Specialized Systems
        this.snapshotSystem = new SnapshotSystem(this);
        this.inputSystem = new InputSystem(this);
        this.predictionSystem = new PredictionSystem(this);

        this.MESHES = undefined;
        this._onShoot = () => {
            console.log("shooting");
            if (!this.MESHES) return;

            let directions = getDirectionalVectors(this.camera.Q.m);
            let result = raycastMeshesAABBAllHits(this.camera.getPosition(), directions.forward, 1000, this.MESHES);
            console.log(result);

            if (result.length > 0) {
                result.forEach((value) => {
                    if (value.mesh.metadata && value.mesh.metadata.zid > -1) {
                        console.log("hit zombie " + value.mesh.metadata.zid);
                        this.sendMessage("shoot", { zid: value.mesh.metadata.zid });
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
            if (this._disposed) return;
            this.snapshotSystem.process(event.detail.snapshot);
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
                    let index = this.zurgModels.push(mesh) - 1;
                    console.log("index" + index + " length: " + this.zurgModels.length);
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
                        armed: false,
                        gunModel: null
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

            for (let i = 0; i < 10; i++) {
                this.loadM1Garrand().then((m1Mesh) => {
                    if (this._disposed) return;
                    m1Mesh.turnY(Math.PI / 180);
                    //m1Mesh.setPosition(.3, 1.5, -1.8);
                    m1Mesh.setPosition(-50 + (10 * i), -20, 0);
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

            if (!this._inputValidate) {
                this.addEventListener("INPUT_VALIDATE", this.onInputValidate);
                this._inputValidate = true;
            }
            //after scene is initialized, connect to server to start receiving game state
            if (!this._connectedOnce &&
                this.networkClient.state !== NetworkClient.STATES.CONNECTED &&
                this.networkClient.state !== NetworkClient.STATES.CONNECTING) {



                this.networkClient.connect("wss://colyseus.flickshotpro.com");
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
        if (this._inputValidate) {
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
    clientTick = 0;
    lastSendCommand = -1;
    networkSendTick = 0;
    boolFirstCommandSent = false;
    inputBuffer = new ClientInputBuffer();

    onInputValidate(event) {
        this.predictionSystem.validate(event);
    }

    onFixedUpdate(tickRate) {
        this.inputSystem.update(tickRate);
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
        if (this.camera) {
            if (this.commandNumber > 1) {
                let command = this.inputBuffer.getInput(this.commandNumber - 1);
                let goal = Vector3.moveTowards(command.startPosition, command.targetPosition, this.fixedTickAccumulator / this.fixedTickRate);
                this.camera.setPosition(goal.x, goal.y, goal.z);
            }
        }
        this.startTime = now;
        this.onUpdate(deltaTime);
    }

}
