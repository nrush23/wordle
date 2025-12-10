import NetworkClient from "./networkClient.js";
import InputManager from "./inputManager.js";
import {Scene} from "../final/final.js";

/** @class GameSession class to handle high level game functions such as world building */
export default class GameSession{
    eventBus;
    /** @type {NetworkClient} */
    networkClient;
    /** @type {InputManager} */
    inputManager;
    /** @type {String} */
    uuid;
    /** @type {Scene} */
    scene;
    /** @param {NetworkClient} networkClient @param {InputManager} inputManager*/
    constructor(eventBus,networkClient,inputManager){
        this.eventBus = eventBus;
        this.networkClient = networkClient;
        this.inputManager = inputManager;
        this.scene = undefined;
        console.log(networkClient);
        this.networkClient.connect("wss://test.flickshotpro.com/ws");

        this.networkClient.addEventListener(NetworkClient.EVENTS.CONNECTED,(event)=>{
            this.uuid = event.detail.uuid;
        });
        
        this.networkClient.addEventListener(NetworkClient.EVENTS.UUIDS,(event)=>{

        });
        this.modelPool = new Map();
        this.unusedModels = [];
        this.eventBus.on("scene:initialized",(event)=>{
             const loadDurgModel = event.loadDurgModel;
                const meshes = event.meshes;

                //fill pool
            for(let i = 0; i < 10;i++){
                loadDurgModel().then((mesh) => {
                    mesh.setPosition(0,-5,0);
                    meshes.push(mesh);
                    let index = this.unusedModels.push(mesh);
                    console.log("[GameSession] generated new durg");
                    console.log(this.unusedModels[index-1]);
                }, (error) => {
                    console.log(error);
                });
            }
           
            this.networkClient.addEventListener(NetworkClient.EVENTS.SNAPSHOT, (event) => {
                let snapshot = event.detail.snapshot;
                if(this.scene){
                    let currentUUIDs = [...this.modelPool.keys()];

                for (let i = 0; i < snapshot.length; i++) {
                    let playerState = snapshot[i];
                    if (playerState.clientId === this.uuid) {
                        this.scene.setCameraPosition(playerState.position.x, playerState.position.y, playerState.position.z);
                    }else{
                        //case brand new uuid
                        let model = this.modelPool.get(playerState.clientId);
                        
                        if(model === undefined){
                            if(this.unusedModels.length > 0){
                                model = this.unusedModels.pop();
                                console.log("[GameSession] filling uuid map with " + playerState.clientId);
                                console.log(model);
                                model.setPosition(playerState.position.x, playerState.position.y, playerState.position.z);
                                this.modelPool.set(playerState.clientId, model);
                                
                            }
                            else{
                                //load a new mesh in then re render on the next snapshot
                                loadDurgModel().then((mesh) => {
                                    meshes.push(mesh);
                                    this.unusedModels.push(mesh);
                                }, (error) => {
                                    console.log(error);
                                });
                            }   
                        }
                        else{
                            console.log("[GameSession] model with uuid exists "+ playerState.clientId);
                            console.log(model);
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
                if(currentUUIDs.length !== 0){
                    for(let i = 0 ; i < currentUUIDs.length;i++){
                        let model = this.modelPool.get(currentUUIDs[i]);
                        model.setPosition(0,-5,0);
                        this.unusedModels.push(model);
                        this.modelPool.delete(currentUUIDs[i]);
                    }
                }
                }
            });

            
        });
    }
    updateWorld(snapshot){

    }
    onFixedUpdate(tickRate){

        //todo: add state for Looping/Updating instead of using NetworkClient state
        if(this.networkClient.state === NetworkClient.STATES.CONNECTED){
            this.networkClient.sendInputState({
                forward:this.inputManager.forward,
                backward:this.inputManager.backward,
                left:this.inputManager.left,
                right:this.inputManager.right
            });
        }
    }
    onUpdate(deltaTime){

    }
    startTime = Date.now();
    fixedTickAccumulator = 0;
    fixedTickRate = 1000/20;
    update(){
        let now = Date.now();
        let deltaTime = now-this.startTime;
        this.fixedTickAccumulator += deltaTime;
        while(this.fixedTickAccumulator>=this.fixedTickRate){
            this.onFixedUpdate(this.fixedTickRate);
            this.fixedTickAccumulator -= this.fixedTickRate;
        }
        this.startTime = now;
        this.onUpdate(deltaTime);
    }
}

class GameState{
    players;
}
class Player{
    mesh;
    position;
}