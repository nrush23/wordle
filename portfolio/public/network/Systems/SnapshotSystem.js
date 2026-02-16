/**
 * Handles processing of game network snapshots.
 */
export default class SnapshotSystem {
    /**
     * @param {GameSession} gameSession - Reference to the main game session.
     */
    constructor(gameSession) {
        this.gs = gameSession;
    }

    /**
     * Entry point for processing a full snapshot.
     * @param {Object} snapshot - The full game snapshot from the server.
     */
    process(snapshot) {
        if (!this.gs.scene || this.gs._disposed) return;

        const { players, zurgs, windows } = snapshot;

        if (players) this.processPlayers(players);
        if (zurgs) this.processZurgs(zurgs);
        if (windows) this.processWindows(windows);
    }

    /**
     * Synchronizes player positions and rotations.
     * @param {Array} playerSnapshot
     */
    processPlayers(playerSnapshot) {
        let currentUUIDs = [...this.gs.meshManager.modelPool.keys()];

        for (let i = 0; i < playerSnapshot.length; i++) {
            let playerState = playerSnapshot[i];

            // Skip local player
            if (playerState.clientId === this.gs.uuid) continue;

            let model = this.gs.meshManager.modelPool.get(playerState.clientId);

            if (model === undefined) {
                this.handleNewPlayer(playerState);
            } else {
                this.updatePlayerModel(model, playerState);
            }

            // Mark this UUID as seen in the current snapshot
            const index = currentUUIDs.indexOf(playerState.clientId);
            if (index !== -1) {
                currentUUIDs.splice(index, 1);
            }
        }

        // Cleanup players no longer in the snapshot
        this.cleanupPlayers(currentUUIDs);
    }

    /**
     * Handles spawning or repurposing a model for a new player.
     * @param {Object} playerState
     */
    handleNewPlayer(playerState) {
        if (this.gs.meshManager.unusedModels.length > 0) {
            let model = this.gs.meshManager.unusedModels.pop();
            model.setRotationRadians(playerState.rotation.x, playerState.rotation.y, playerState.rotation.z);
            model.setPosition(playerState.position.x, playerState.position.y, playerState.position.z);
            this.gs.meshManager.modelPool.set(playerState.clientId, model);
        } else if (this.gs.meshManager.meshes && this.gs.meshManager.loadDurgModel) {
            this.gs.meshManager.loadDurgModel().then((mesh) => {
                if (this.gs._disposed) return;
                this.gs.meshManager.meshes.push(mesh);
                this.gs.meshManager.unusedModels.push(mesh);
            }).catch(console.error);
        }
    }

    /**
     * Updates an existing player model's state.
     * @param {Mesh} model
     * @param {Object} playerState
     */
    updatePlayerModel(model, playerState) {
        model.setRotationRadians(playerState.rotation.x, playerState.rotation.y, playerState.rotation.z);
        model.setPosition(playerState.position.x, playerState.position.y, playerState.position.z);

        if (model.metadata && !model.metadata.armed && this.gs.meshManager.gunPool.length > 0) {
            model.metadata.armed = true;
            model.metadata.gunModel = this.gs.meshManager.gunPool.pop();
            model.metadata.gunModel.setPosition(0, 1, 0);
            model.metadata.gunModel.setParent(model);
        }
    }

    /**
     * Returns models of disconnected players to the pool.
     * @param {Array} uuidsToCleanup
     */
    cleanupPlayers(uuidsToCleanup) {
        for (let i = 0; i < uuidsToCleanup.length; i++) {
            let uuid = uuidsToCleanup[i];
            let model = this.gs.meshManager.modelPool.get(uuid);
            if (!model) continue;

            model.setPosition(0, -5, 0);
            if (model.metadata) {
                model.metadata.armed = false;
                if (model.metadata.gunModel) {
                    model.metadata.gunModel.setParent(null);
                    model.metadata.gunModel.setPosition(0, -10, 0);
                    this.gs.meshManager.gunPool.push(model.metadata.gunModel);
                }
            }
            this.gs.meshManager.unusedModels.push(model);
            this.gs.meshManager.modelPool.delete(uuid);
        }
    }

    /**
     * Updates Zurg positions and rotations.
     * @param {Array} zurgSnapshot
     */
    processZurgs(zurgSnapshot) {
        for (let i = 0; i < zurgSnapshot.length; i++) {
            let snapshotValue = zurgSnapshot[i];
            let zurgModel = this.gs.meshManager.zurgModels[snapshotValue.id];
            if (!zurgModel) continue;

            zurgModel.metadata.health = snapshotValue.health.health;
            let currentPosition = zurgModel.getPosition();
            let targetPosition = snapshotValue.position;

            let direction = {
                x: targetPosition.x - currentPosition.x,
                z: targetPosition.z - currentPosition.z,
                y: 0
            };

            zurgModel.clearRotation();
            zurgModel.turnY(-Math.atan2(direction.x, direction.z));
            zurgModel.setPosition(snapshotValue.position.x, snapshotValue.position.y, snapshotValue.position.z);
        }
    }

    /**
     * Updates window board visibility based on health.
     * @param {Array} windowSnapshot
     */
    processWindows(windowSnapshot) {
        for (let i = 0; i < windowSnapshot.length; i++) {
            let snapshotValue = windowSnapshot[i];
            const windowId = snapshotValue.id;
            const health = snapshotValue.health.health;

            this.gs.windowHealth[windowId] = health;

            if (this.gs.windows.length > windowId) {
                let boards = this.gs.windows[windowId].boards;

                // Boards visibility logic based on health % (100, 75, 50, 25, 0)
                boards[0].render = health >= 100;
                boards[1].render = health >= 75;
                boards[2].render = health >= 50;
                boards[3].render = health >= 25;
            }
        }
    }
}
