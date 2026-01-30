import WebSocketTransport from "./transport.js";


/** important jsdoc for event typing intellisense
 * @typedef {Object} NetworkClientEventMap
 * @property {CustomEvent<{ connected: WebSocketTransport }>} connected
 * @property {CustomEvent<{ snapshot: string | ArrayBuffer | Blob }>} snapshot
 * @property {CustomEvent<{ serverError: number, reason: string, wasClean: boolean }>} serverError
 * @property {CustomEvent<{ disconnected: number, reason: string, wasClean: boolean }>} disconnected
 * @property {CustomEvent<{ reconnecting: number, reason: string, wasClean: boolean }>} reconnecting
 */

/** @class NetworkClient abstracted game network protocol manager to handle client server handshake and game level protocol messages; uses transport interface for now just websockets in future a udp protocol based on gaffer on games article*/
export default class NetworkClient extends EventTarget{
    static STATES = {
        RECONNECTING:"reconnecting",
        CONNECTING:"connecting",
        CONNECTED:"connected",
        DISCONNECTED:"disconnected"
    };
    static EVENTS ={
        CONNECTED:"connected",
        SNAPSHOT:"snapshot",
        UUIDS:"uuids",
        GENERIC:"generic"
    };
    static CODES = {
        normal:0
    }
    state;
    timeSinceLastServerMessage;
    /** @type {Map<String,Number>} map of interval id's to make sure to close when the network client is disposed */
    intervals;
    constructor(){
        super();
        this.state = NetworkClient.STATES.DISCONNECTED;
        this.intervals = new Map();
        this.startClock();
    }
    startClock() {
        let timeOut = 5000;
        let timeOutInterval = setInterval(() => {
            if (this.state === NetworkClient.STATES.CONNECTED) {
                if (Date.now() - this.timeSinceLastServerMessage >= timeOut) {
                    this.state = NetworkClient.STATES.DISCONNECTED;
                    this.disconnect(NetworkClient.CODES.normal, "server timed out");
                }
            }
        }, timeOut);
        this.intervals.set("timeout",{intervalId:timeOutInterval});

        let pingTime = 1000;
        let pingTimeInterval = setInterval(() => {
            if (this.state === NetworkClient.STATES.CONNECTED) {
                if (Date.now() - this.timeSinceLastServerMessage >= pingTime) {
                    this.sendPing();
                }
            }
        }, pingTime);
        this.intervals.set("ping",{intervalId:pingTimeInterval});
    }
    clock(){

    }
    connect(url){
        //if already attempting connection/reconnection
        if (this.state === NetworkClient.STATES.RECONNECTING || NetworkClient.state === NetworkClient.STATES.CONNECTING) {
            console.warn("[WebSocketTransport] connect() called while state =", this.state);
            return;
        }

        //set state to connecting
        this.state = NetworkClient.STATES.CONNECTING;

        // init transport in this case websocket client in future udp
        this.transport  = new WebSocketTransport();

        //once underlying transport is ready to send messages send out handshake request
        this.transport.addEventListener("open", (event) => {
            console.log("[NetworkClient]transport open");
            this.sendJoin({username:"no name yuh",secretKey:"asdasdasdasd"});
        });

        //hook up different protocol level and game level packet messages
        //for now data is json in future will be bytes
        this.transport.addEventListener("message", (event) => {
            this.timeSinceLastServerMessage = Date.now();
            let data = event.detail.data;
            try {
                let packet = JSON.parse(data);
                let id = packet.id;
                switch(packet.id){
                    case 0://handshake complete; now transition to connected
                        let uuid = packet.uuid;
                        console.log("{NetworkClient] finished connecting uuid id:"+uuid);
                        this.state = NetworkClient.STATES.CONNECTED;
                        this.dispatchEvent(new CustomEvent(NetworkClient.EVENTS.CONNECTED,{detail:{
                            uuid:uuid
                        }}));
                        //send first ping to avoid timeout
                        this.transport.send(JSON.stringify(
                            {
                                id: 1,
                                date: Date.now()
                            }
                        ));
                        break;
                    case 1://game state update
                        let uuids = packet.uuids;
                        console.log(packet.uuids);
                        this.dispatchEvent(new CustomEvent(NetworkClient.EVENTS.UUIDS,{detail:{
                            uuids:uuids
                        }}));
                        break;
                    case 2://server pong
                        console.log("NetworkClient] received server pong");
                        break;
                    case 3:
                        this.dispatchEvent(new CustomEvent(NetworkClient.EVENTS.SNAPSHOT,{detail:{
                            snapshot:packet.snapshot
                        }}));
                        break;
                    case 11: // generic event message 
                    //console.log(packet);
                        this.dispatchEvent(new CustomEvent(NetworkClient.EVENTS.GENERIC,{detail:{
                            event:packet.event,
                            data:packet.data
                        }}))
                        break;
                    default:
                        console.warn("[NetworkClient] unknown packet id received "+packet.id);
                }
            } catch (error) {
                console.error("NetworkClient] Failed to parse JSON:", error.message);
                this.transport.close(NetworkClient.CODES.normal,"failed to parse json");
            }

        });
        this.transport.addEventListener("close",(event)=>{

        });
        this.transport.addEventListener("error",(event)=>{

        });
        this.transport.connect(url);
        console.log("NetworkClient] connecting...");
    }
    disconnect(code,reason){

    }
    close(code,reason){
        //make sure to clear intervals
        this.intervals.forEach((value,key,map)=>{
            clearInterval(value.intervalId);
        });
        this.intervals.clear();
    }
    
    //send ping when in connected state only
    sendPing(){
        if(this.state === NetworkClient.STATES.CONNECTED){
            this.transport.send(JSON.stringify(
                {
                    id: 1,
                    date:Date.now()
                }
            ));
        }
        else{
            console.warn("[NetworkClient] not in state to send packet STATE: " + this.state);
        }
    }
    //send join request aka first step of connection handshake
    sendJoin(joinInfo){
        this.transport.send(JSON.stringify(
            {
                id: 0,
                payload: "Requesting connection",
                username: joinInfo.username,
                secretKey: joinInfo.secretKey
            }
        ));
    }
    sendInputState(inputState){
        this.transport.send(JSON.stringify(
            {
                id: 10,
                inputState:inputState
            }
        ));
    }
    
    sendMessage(event,data){
        this.transport.send(JSON.stringify(
            {
                id:11,
                event:event,
                data:data
            }
        ));
    }
    sendChat(chatPacket){

    }
    
    //optional but probably will keep
    getLatency(){

    }

    //really cool way to type events, never realized this
    /**
    * @template {keyof NetworkClientEventMap} K
    * @param {K} type
    * @param {(event: NetworkClientEventMap[K]) => void} listener
    */
    addEventListener(type, listener) {
        return super.addEventListener(type, listener);
    }
}