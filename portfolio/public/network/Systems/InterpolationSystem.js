import Vector3 from "../vector3.js";

/**
 * Handles visual interpolation between fixed simulation ticks to ensure smooth rendering.
 */
export default class InterpolationSystem {
    /**
     * @param {GameSession} gameSession - Reference to the main game session.
     */
    constructor(gameSession) {
        this.gs = gameSession;
    }

    /**
     * Updates the visual position of entities (like the camera) based on the current fixed tick progress.
     */
    update() {
        if (!this.gs.camera || this.gs.commandNumber <= 1) return;

        // Get the progress between the last two fixed ticks (0.0 to 1.0)
        let alpha = this.gs.fixedTickAccumulator / this.gs.fixedTickRate;

        // Get the most recent command to find start and end (target) positions
        let command = this.gs.inputBuffer.getInput(this.gs.commandNumber - 1);

        // Interpolate position
        let smoothedPosition = Vector3.moveTowards(
            command.startPosition,
            command.targetPosition,
            alpha
        );

        // Update camera position
        this.gs.camera.setPosition(smoothedPosition.x, smoothedPosition.y, smoothedPosition.z);
    }
}
