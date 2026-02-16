import { getDirectionalVectors } from "../Utils/MathUtils.js";
import { raycastMeshesAABBAllHits } from "../Utils/Raycast.js";

/**
 * Handles shooting logic and events for the game session.
 */
export default class ShootingSystem {
    /**
     * @param {GameSession} gameSession - Reference to the main game session.
     */
    constructor(gameSession) {
        this.gs = gameSession;
        this._onShoot = this.onShoot.bind(this);
    }

    /**
     * Initializes the shooting system event listeners.
     */
    initialize() {
        this.gs.addEventListener("shoot", this._onShoot);
    }

    /**
     * Handles the "shoot" event.
     */
    onShoot() {
        console.log("shooting");
        if (!this.gs.meshManager.meshes || !this.gs.camera) return;

        let directions = getDirectionalVectors(this.gs.camera.Q.m);
        let result = raycastMeshesAABBAllHits(
            this.gs.camera.getPosition(),
            directions.forward,
            1000,
            this.gs.meshManager.meshes
        );
        console.log(result);

        if (result.length > 0) {
            result.forEach((value) => {
                if (value.mesh.metadata && value.mesh.metadata.zid > -1) {
                    console.log("hit zombie " + value.mesh.metadata.zid);
                    this.gs.sendMessage("shoot", { zid: value.mesh.metadata.zid });
                }
            });
        }
    }

    /**
     * Cleans up event listeners.
     */
    dispose() {
        this.gs.removeEventListener("shoot", this._onShoot);
    }
}
