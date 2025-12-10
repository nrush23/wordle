/** @cllas Transport generic socket transport class for use in future to write protocol based on gaffer on games article to work both over udp and websocket */
class Transport extends EventTarget{
    static STATES = {
        IDLE:"idle",
        CONNECTING:"connecting",
        OPEN:"open",
        CLOSING:"closing",
        CLOSED:"closed"
    }
    constructor(){
        super();

        /**@type {"idle" | "connecting" | "open" | "closing" | "closed"}*/
        this.state = Transport.STATES.IDLE;
    }
    /** @param {string} url */
    connect(url){
        throw new Error("Transport.connect must be implemented by subclass");
    }
    /** @param {string | ArrayBuffer | Blob} data */
    send(data){
        throw new Error("Transport.send must be implemented by subclass");
    }
    /**
    * Request graceful close
    * Implementations are responsible for transitioning to closing/closed
    * Based on WS Library close
    * @param {number} [code]
    * @param {string} [reason]
    */
    close(code, reason){
        throw new Error("Transport.close must be implemented by subclass");
    }
}



/** JSDOC for describing the events. Maybe not entirely necessary but i left it
 * Fired when the underlying WebSocket connection is opened.
 *
 * @event WebSocketTransport#open
 * @type {CustomEvent<{ transport: WebSocketTransport }>}
 */

/**
 * Fired when a message is received from the WebSocket.
 *
 * @event WebSocketTransport#message
 * @type {CustomEvent<{ data: string | ArrayBuffer | Blob }>}
 */

/**
 * Fired when the WebSocket encounters an error.
 *
 * @event WebSocketTransport#error
 * @type {CustomEvent<{ error: Event | Error }>}
 */

/**
 * Fired when the WebSocket connection is closed.
 *
 * @event WebSocketTransport#close
 * @type {CustomEvent<{ code: number, reason: string, wasClean: boolean }>}
 */

/** important jsdoc for event typing intellisense
 * @typedef {Object} WebSocketTransportEventMap
 * @property {CustomEvent<{ transport: WebSocketTransport }>} open
 * @property {CustomEvent<{ data: string | ArrayBuffer | Blob }>} message
 * @property {CustomEvent<{ error: Event | Error }>} error
 * @property {CustomEvent<{ code: number, reason: string, wasClean: boolean }>} close
 */

/** semi important jsdoc for events mainly for documentation
 * @class WebSocketTransport
 * @extends Transport
 * WebSocket-based implementation of Transport. pretty much copying internal websocket events
 *
 * @fires WebSocketTransport#open
 * @fires WebSocketTransport#message
 * @fires WebSocketTransport#error
 * @fires WebSocketTransport#close

 */


export default class WebSocketTransport extends Transport{
    

    /** @type {WebSocket | null} */
    webSocket;
    constructor(){
        super();
        this.webSocket = null;
        
    }

    

    
    connect(url){
        if (this.state === Transport.STATES.OPEN || this.state === Transport.STATES.CONNECTING) {
            console.warn("[WebSocketTransport] connect() called while state =", this.state);
            return;
        }

        this.state = Transport.STATES.CONNECTING;

        this.webSocket= new WebSocket(url);
        this.webSocket.addEventListener("open", (event) => {
            this.state = Transport.STATES.OPEN;
            this.dispatchEvent(new CustomEvent("open",{detail:{transport:this}}));
        });

        // Listen for messages
        this.webSocket.addEventListener("message", (event) => {
            // event.data can be string, Blob, ArrayBuffer, etc.
            this.dispatchEvent(new CustomEvent("message",{detail:{data:event.data}}))
        });
        this.webSocket.addEventListener("error", (event) => {
            //dispatch error
            this.dispatchEvent(new CustomEvent("error",{detail:{error:event}}));
        });
        this.webSocket.addEventListener("close", (event) => {
            this.state = Transport.STATES.CLOSED;
            this.webSocket = null;
            //dispatch close reason
            this.dispatchEvent(new CustomEvent("close",{detail:{
                code:event.code,
                reason:event.reason,
                wasClean:event.wasClean
            }}));
        });
    }
    /** @param {string | ArrayBuffer | Blob} data */
    send(data){
        if (!this.webSocket || this.state !== Transport.STATES.OPEN) {
            console.warn("[WebSocketTransport] Ignoring send() while socket is not open");
            return;
        }

        // Optional: you could add runtime type checks here.
        this.webSocket.send(data);
    }
    close(code, reason) {
        if (!this.webSocket) {
            console.warn("[WebSocketTransport] webSocket is not initialized")
            return;
        }

        // Let the WebSocket close event drive the "close" dispatch.
        // We don't manually emit "close" here to avoid double-firing.
        this.state = Transport.STATES.CLOSING;
        try {
            this.webSocket.close(code, reason);
        } catch (err) {
            this.dispatchEvent(
                new CustomEvent("error", {
                    detail: { error: err },
                }),
            );
        }
    }

    //really cool way to type events, never realized this
    /**
    * @template {keyof WebSocketTransportEventMap} K
    * @param {K} type
    * @param {(event: WebSocketTransportEventMap[K]) => void} listener
    */
    addEventListener(type, listener) {
        return super.addEventListener(type, listener);
    }
}

