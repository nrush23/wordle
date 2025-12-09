import NetworkClient from "./networkClient.js";
import InputManager from "./inputManager.js";
/** @class GameSession class to handle high level game functions such as world building */
export default class GameSession{
    eventBus;
    /** @type {NetworkClient} */
    networkClient;
    /** @type {InputManager} */
    inputManager;
    /** @type {String} */
    uuid;
    /** @param {NetworkClient} networkClient @param {InputManager} inputManager*/
    constructor(eventBus,networkClient,inputManager){
        this.eventBus = eventBus;
        this.networkClient = networkClient;
        this.inputManager = inputManager;

        console.log(networkClient);
        this.networkClient.connect("ws://localhost:3001");

        this.networkClient.addEventListener(NetworkClient.EVENTS.CONNECTED,(event)=>{
            this.uuid = event.detail.uuid;
        });
        this.networkClient.addEventListener(NetworkClient.EVENTS.SNAPSHOT,(event)=>{
            console.log(event.detail.snapshot);
        });
        this.networkClient.addEventListener(NetworkClient.EVENTS.UUIDS,(event)=>{

        });
    }
    onFixedUpdate(tickRate){
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