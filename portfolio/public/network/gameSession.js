import NetworkClient from "./networkClient.js";
import InputManager from "./inputManager.js";
import customEventHandler from "./customEventHandler.js";
import { Scene } from "../final/renderer.js";
import WindowManager from "../final/gameLogic/WindowManager.js";
import Zurg from "../final/gameLogic/zurg.js";

class Vector3 {
  constructor(x, y, z) {
    this.x = x ?? 0;
    this.y = y ?? 0;
    this.z = z ?? 0;
  }
  static distance(a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dz = b.z - a.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  static moveTowards(start, goal, maxDistance) {
    const dx = goal.x - start.x;
    const dy = goal.y - start.y;
    const dz = goal.z - start.z;

    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    // If already at the goal or within range, return goal
    if (distance === 0 || distance <= maxDistance) {
      return { x: goal.x, y: goal.y, z: goal.z };
    }

    const t = maxDistance / distance;

    return {
      x: start.x + dx * t,
      y: start.y + dy * t,
      z: start.z + dz * t
    };
  }
}
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

    /** @type {Number} just tracks the tick since scene initialized */
    clientTick = 0;
    /** @param {NetworkClient} networkClient @param {InputManager} inputManager*/
    constructor(eventBus, networkClient, inputManager) {
        super();
        this._sessionId = Math.random().toString(16).slice(2);

        this.eventBus = eventBus;
        this.networkClient = networkClient;
        this.inputManager = inputManager;
        this.inputManager.gameShell = this;
        this.scene = undefined;
        this.camera = undefined;
        console.log(networkClient);
        this.networkClient.connect("wss://test.flickshotpro.com/ws");

        this.networkClient.addEventListener(NetworkClient.EVENTS.GENERIC, (event) => {
            this.dispatchEvent(new CustomEvent(event.detail.event, { detail: event.detail.data }));
        });


        this.networkClient.addEventListener(NetworkClient.EVENTS.CONNECTED, (event) => {
            this.uuid = event.detail.uuid;
            customEventHandler(this);
        });

        this.networkClient.addEventListener(NetworkClient.EVENTS.UUIDS, (event) => {

        });

        this.modelPool = new Map();
        this.unusedModels = [];
        this.zurgModels = [];
        this.eventBus.on("scene:initialized", (event) => {
            console.log(` ${this._sessionId} gameSession id initialized`);
            

            const loadDurgModel = event.loadDurgModel;
            const loadZurgModel = event.loadZurgModel;
            const meshes = event.meshes;
            this.camera = event.camera;

            const TEST_ZURG = new Zurg(1);
            TEST_ZURG.makeBody().then(()=>{
                meshes.push(TEST_ZURG.body);
            },(error)=>{});

            this.windowManager = new WindowManager();
            this.windows = [];
            this.windowHealth = [75,50,25,75, 100,0,0,0,0];
            this.windowManager.initialize().then((boards) => {
                console.log(` ${this._sessionId} gameSession window manager initialized`);
                for(let i =0;i<boards.length/4;i++){
                    this.windows.push({
                        boards:[
                            boards[(i*4) +0 ],
                            boards[(i*4) +1 ],
                            boards[(i*4) +2 ],
                            boards[(i*4) +3 ]
                        ]
                    });
                }
                console.log(this.windows);
                this.windowManager.initialized = true;

                

            }, (error) => {
                console.log(error);
            });
            
            //fill zurg pool
            const MAX_ZURGS = 15;
            for (let i = 0;i<MAX_ZURGS;i++){
                loadZurgModel().then((mesh)=>{
                    meshes.push(mesh);
                    this.zurgModels.push(mesh);
                    mesh.name = "zurg" + i;
                    mesh.metadata = {
                        zid:i,
                        health:-1
                    };
                },(error)=>{console.log(error)});
            }

            //fill pool
            for (let i = 0; i < 10; i++) {
                loadDurgModel().then((mesh) => {
                    mesh.setPosition(0, -5, 0);
                    meshes.push(mesh);
                    let index = this.unusedModels.push(mesh);
                    console.log(`[GameSession][${this._sessionId}] generated new durg`);
                    console.log(this.unusedModels[index - 1]);
                }, (error) => {
                    console.log(error);
                });
            }

            //hook up shoot event
            this.addEventListener("shoot", () => {
                let directions = this.getDirectionalVectors(this.camera.Q.m);
                let result = raycastMeshesAABBAllHits(this.camera.getPosition(), directions.forward, 1000, meshes);
                console.log(result);
                if(result.length>0){
                    result.forEach((value)=>{
                        if(value.mesh.metadata){
                            this.eventBus.emit("game:hit",{name:value.mesh.name});
                            if(value.mesh.metadata.zid){
                                //value.mesh.render = false;
                            }
                            this.sendMessage("shoot",{zid:value.mesh.metadata.zid});
                        }
                    });
                }
            });

            this.networkClient.addEventListener(NetworkClient.EVENTS.SNAPSHOT, (event) => {
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
                            this.scene.setCameraPosition(playerState.position.x, playerState.position.y, playerState.position.z);
                            //console.log(playerState.health);
                            //console.log(playerState.position);
                        } else {
                            //case brand new uuid
                            let model = this.modelPool.get(playerState.clientId);

                            if (model === undefined) {
                                if (this.unusedModels.length > 0) {
                                    model = this.unusedModels.pop();
                                    //console.log("[GameSession] filling uuid map with " + playerState.clientId);
                                    //console.log(model);
                                    model.setPosition(playerState.position.x, playerState.position.y, playerState.position.z);
                                    this.modelPool.set(playerState.clientId, model);

                                }
                                else {
                                    //load a new mesh in then re render on the next snapshot
                                    loadDurgModel().then((mesh) => {
                                        meshes.push(mesh);
                                        this.unusedModels.push(mesh);
                                    }, (error) => {
                                        console.log(error);
                                    });
                                }
                            }
                            else {
                                //console.log("[GameSession] model with uuid exists "+ playerState.clientId);
                                //console.log(model);
                                model.setPosition(playerState.position.x, playerState.position.y, playerState.position.z);
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
                            this.unusedModels.push(model);
                            this.modelPool.delete(currentUUIDs[i]);
                        }
                    }

                    //render zurg snapshot
                    for(let i = 0 ; i < zurgSnapshot.length;i++){
                        let snapshot = zurgSnapshot[i];
                        let zurgModel = this.zurgModels[snapshot.zid];
                        if (zurgModel){
                            zurgModel.metadata.health = snapshot.health;
                            //console.log(zurgModel.metadata);
                            zurgModel.setPosition(snapshot.position.x,snapshot.position.y,snapshot.position.z);
                        }
                    }

                    for(let i = 0; i<windowSnapshot.length;i++){
                        let snapshot = windowSnapshot[i];
                        this.windowHealth[snapshot.windowId] = snapshot.health;

                        //just for fun disable windows 2
                        if (this.windows.length > 0) {
                            this.windows[1].boards[0].render = !this.windows[1].boards[0].render;
                            this.windows[1].boards[1].render = !this.windows[1].boards[1].render;
                            this.windows[1].boards[2].render = !this.windows[1].boards[2].render;
                            this.windows[1].boards[3].render = !this.windows[1].boards[3].render;
                            console.log(`[GameSession][${this._sessionId}] blinking windows`);
                            console.log(this.windows[1]);
                            console.log(`[GameSession][${this._sessionId}]`);
                        }
                    }
                }
            });


        });
    }
    updateWorld(snapshot) {

    }
    onFixedUpdate(tickRate) {

        //todo: add state for Looping/Updating instead of using NetworkClient state
        if (this.networkClient.state === NetworkClient.STATES.CONNECTED) {
            //todo: a way client can send to server which zombies get shot
            //todo: send zombie health
            //todo: send player health
            //todo: send player ammo
            //todo: client running same window logic

            if (this.camera) {
                let inputState = {
                    clientTick: this.clientTick,
                    forward: this.inputManager.forward,
                    backward: this.inputManager.backward,
                    left: this.inputManager.left,
                    right: this.inputManager.right,
                    directionalVectors: this.getDirectionalVectors(this.camera.Q.m)
                };
                this.networkClient.sendInputState(inputState);
                this.clientTick += 1;
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
        this.startTime = now;
        this.onUpdate(deltaTime);
    }

    //helper
    getDirectionalVectors = (matrix)=>{
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
         forward:forward,
         right:right,
         up:up
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
        if (t !== null) hits.push({ index: i, distance: t, mesh:meshes[i] });
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