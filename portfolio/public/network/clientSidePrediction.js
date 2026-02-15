import Vector3 from "./vector3.js";

var commandNumber = 0;

export class InputState {
    forward;
    backward;
    left;
    right;
    directionalVectors;

    constructor(
        forward = false,
        backward = false,
        left = false,
        right = false,
        directionalVectors = {forward:new Vector3(), up:new Vector3(), right:new Vector3()}
    ) {
        this.forward = forward;
        this.backward = backward;
        this.left = left;
        this.right = right;
        this.directionalVectors = directionalVectors;
    }
    /**@param {InputState} inputState  */
    copy(inputState){
        this.forward = inputState.forward;
        this.backward = inputState.backward;
        this.left = inputState.left;
        this.right = inputState.right;
        this.directionalVectors.forward.copy(inputState.directionalVectors.forward);
        this.directionalVectors.up.copy(inputState.directionalVectors.up);
        this.directionalVectors.right.copy(inputState.directionalVectors.right);
    }
}
export class InputCommand{
    /** @type {Number} */
    commandNumber;
    /** @type {Number} */
    clientTick;
    /** @type {InputState} */
    inputState;

    //debug;
    /** @type {Vector3} */
    startPosition;
    /** @type {Vector3} */
    targetPosition;
    /** @type {Vector3} */
    rotation;
    constructor(
        commandNumber = -1,
        clientTick = 0,
        inputState = new InputState(),
        startPosition = new Vector3(),
        targetPosition = new Vector3(),
        rotation = new Vector3()
    ){
        this.commandNumber = commandNumber;
        this.clientTick = clientTick;
        this.inputState = inputState;
        this.startPosition = startPosition;
        this.targetPosition = targetPosition;
        this.rotation = rotation;
    }
    /** @param {InputCommand} command */
    set(command){
        this.commandNumber = command.commandNumber;
        this.clientTick = command.clientTick;
        this.inputState.copy(command.inputState);
        this.startPosition.copy(command.startPosition);
        this.targetPosition.copy(command.targetPosition);
        this.rotation.copy(command.rotation);
    }
}
export class ClientInputBuffer{
    static BUFFER_SIZE = 128;
    _buffer;
    constructor(){
        //init size 128 bufer
        this._buffer = new Array(ClientInputBuffer.BUFFER_SIZE);
        for(let i = 0; i<ClientInputBuffer.BUFFER_SIZE;i++){
            this._buffer[i] = new InputCommand();
        }
    }
    addInput(commandNumber, inputCommand){
        let index = commandNumber % ClientInputBuffer.BUFFER_SIZE;
        let command = this._buffer[index];
        //console.log();
        command.set(inputCommand);
    }
    getInput(commandNumber){
        let index = commandNumber % ClientInputBuffer.BUFFER_SIZE;
        return this._buffer[index];
    }
}
export class ClientCommandRing {
    constructor(size = 64) {
        this.size = size;
        this.entries = new Array(size);
        this.latestCommand = -1;
        this.lastAcknowledgedCommand = -1;
    }
    /** @function set set's command to corresponding commandNumber slot in ring buffer */
    set(command, predictedStateAfter = null) {
        const i = command.commandNumber % this.size;
        this.entries[i] = {
            commandNumber: command.commandNumber,
            command,
            predictedStateAfter
        };
        this.latestCommand = command.commandNumber;
    }
    /** @function get get's command with that number at the corresponding slot if it exists */
    get(commandNumber) {
        const e = this.entries[commandNumber % this.size];
        if (!e || e.commandNumber !== commandNumber) return null;
        return e;
    }

    /** @function confirmAcknowledge pass confirmed ack numbers into the function to update lastKnownAck */
    confirmAcknowledge(acknowledgedCommand) {
        // logical trim only
        if (acknowledgedCommand > this.lastAcknowledgedCommand) {
            this.lastAcknowledgedCommand = acknowledgedCommand;
        }
    }

    /** @function collectRecent gather the specified most recent commands ignoring ones already sent and ack'd by server */
    collectRecent(count) {
        const out = [];
        for (let k = 0; k < count; k++) {
            const c = this.latestCommand - k;
            if (c <= this.lastAcknowledgedCommand) break;
            const e = this.get(c);
            if (e) out.push(e.command);
        }
        out.reverse(); // oldest->newest
        return out;
    }
}

export function simulate(inputState, cameraPosition) {
    let position = new Vector3(cameraPosition.x, cameraPosition.y, cameraPosition.z);

    //these directions are flipped flopped due to rotation issues
    //on render side
    const MOVEMENT_SPEED = 3;
    const LERP_TIME = ((1000 / 20) / 1000);
    const FORWARD = inputState.directionalVectors.forward;
    const RIGHT = inputState.directionalVectors.right;

    let velocity = new Vector3();
    if (inputState.forward) {
        velocity.z += 1;
    }
    if (inputState.backward) {
        velocity.z -= 1;
    }
    if (inputState.left) {
        velocity.x -= 1;
    }
    if (inputState.right) {
        velocity.x += 1;
    }

    let displacement = new Vector3();

    displacement.x += FORWARD.x * LERP_TIME * (MOVEMENT_SPEED * velocity.z);
    displacement.y += FORWARD.y * LERP_TIME * (MOVEMENT_SPEED * velocity.z);
    displacement.z += FORWARD.z * LERP_TIME * (MOVEMENT_SPEED * velocity.z);

    displacement.x += RIGHT.x * LERP_TIME * (MOVEMENT_SPEED * velocity.x);
    displacement.y += RIGHT.y * LERP_TIME * (MOVEMENT_SPEED * velocity.x);
    displacement.z += RIGHT.z * LERP_TIME * (MOVEMENT_SPEED * velocity.x);

    position.x += displacement.x;
    //position.y += displacement.y;
    position.y = 1;
    position.z += displacement.z;
    return position;
}

export function getInputCommand(){

}
