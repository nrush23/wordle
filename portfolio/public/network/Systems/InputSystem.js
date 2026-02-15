import { simulate } from "../clientSidePrediction.js";
import { getDirectionalVectors } from "../Utils/MathUtils.js";
import NetworkClient from "../networkClient.js";

/**
 * Handles the fixed-rate update loop for capturing input and sending it to the server.
 */
export default class InputSystem {
    /**
     * @param {GameSession} gameSession - Reference to the main game session.
     */
    constructor(gameSession) {
        this.gs = gameSession;
    }

    /**
     * Executes the fixed update logic.
     * @param {Number} tickRate - The fixed tick rate interval.
     */
    update(tickRate) {
        if (this.gs.networkClient.state !== NetworkClient.STATES.CONNECTED || !this.gs.camera) {
            return;
        }

        // Get or create input command object for the current command number
        let inputCommand = this.gs.inputBuffer.getInput(this.gs.commandNumber);
        inputCommand.commandNumber = this.gs.commandNumber;
        inputCommand.clientTick = this.gs.clientTick;

        // Capture current input state
        this.captureInputState(inputCommand);

        // Calculate positions for client-side prediction
        this.calculatePredictedPositions(inputCommand);

        // Capture camera rotation
        inputCommand.rotation = this.gs.camera.getRotationRadians();

        // Send to server
        this.gs.networkClient.sendInputState(inputCommand);

        // Increment counters
        this.gs.commandNumber += 1;
        this.gs.clientTick += 1;
    }

    /**
     * Copies input state from InputManager to the command object.
     * @param {InputCommand} inputCommand
     */
    captureInputState(inputCommand) {
        const { inputState } = inputCommand;
        const { inputManager, camera } = this.gs;

        inputState.forward = inputManager.forward;
        inputState.backward = inputManager.backward;
        inputState.left = inputManager.left;
        inputState.right = inputManager.right;

        // Compute directional vectors for movement calculation
        inputState.directionalVectors = getDirectionalVectors(camera.Q.m);
    }

    /**
     * Calculates the predicted start and target positions for the current command.
     * @param {InputCommand} inputCommand
     */
    calculatePredictedPositions(inputCommand) {
        if (this.gs.commandNumber === 0) {
            const pos = this.gs.camera.getPosition(false);
            inputCommand.startPosition.x = pos.x;
            inputCommand.startPosition.y = pos.y;
            inputCommand.startPosition.z = pos.z;
        } else {
            // Start from the target of the previous command
            const prevCommand = this.gs.inputBuffer.getInput(this.gs.commandNumber - 1);
            inputCommand.startPosition.copy(prevCommand.targetPosition);
        }

        // Simulate movement to get target position
        inputCommand.targetPosition.copy(simulate(inputCommand.inputState, inputCommand.startPosition));
    }
}
