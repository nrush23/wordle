import { simulate } from "../clientSidePrediction.js";

/**
 * Handles validation of client-side prediction and reconciliation of state.
 */
export default class PredictionSystem {
    /**
     * @param {GameSession} gameSession - Reference to the main game session.
     */
    constructor(gameSession) {
        this.gs = gameSession;
    }

    /**
     * Validates a command's result against the server's authoritative result.
     * @param {CustomEvent} event - The validation event from the network.
     */
    validate(event) {
        const { inputCommand, trueResult } = event.detail;

        const matched = (
            inputCommand.targetPosition.x === trueResult.x &&
            inputCommand.targetPosition.y === trueResult.y &&
            inputCommand.targetPosition.z === trueResult.z
        );

        //console.log(`[PredictionSystem] Command ${inputCommand.commandNumber} matched: ${matched}`);

        if (!matched) {
            this.reconcile(inputCommand.commandNumber, trueResult);
        }
    }

    /**
     * Reconciles the client state by correcting the mispredicted command and re-simulating subsequent ones.
     * @param {Number} commandNumber - The number of the command that failed validation.
     * @param {Object} trueResult - The authoritative position from the server.
     */
    reconcile(commandNumber, trueResult) {
        const { inputBuffer, clientCommandRing } = this.gs;
        let command = inputBuffer.getInput(commandNumber);

        // Correct the mispredicted command
        if (command.commandNumber === commandNumber) {
            command.targetPosition.x = trueResult.x;
            command.targetPosition.y = trueResult.y;
            command.targetPosition.z = trueResult.z;

            // Re-simulate subsequent commands in the buffer
            // Note: Using clientCommandRing if it exists, otherwise fallback to inputBuffer
            const ring = clientCommandRing || inputBuffer;

            for (let i = commandNumber; i < inputBuffer.length - 1; i++) {
                const command1 = ring.get ? ring.get(i) : ring.getInput(i);
                const command2 = ring.get ? ring.get(i + 1) : ring.getInput(i + 1);

                if (!command1 || !command2) break;

                command2.startPosition.x = command1.targetPosition.x;
                command2.startPosition.y = command1.targetPosition.y;
                command2.startPosition.z = command1.targetPosition.z;

                // Re-calculate target position based on corrected start position
                command2.targetPosition.copy(simulate(command2.inputState, command2.startPosition));
            }
        }
    }
}
