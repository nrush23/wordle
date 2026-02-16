/**
 * Handles loading, pooling, and managing 3D meshes and models.
 */
export default class MeshManager {
    /**
     * @param {GameSession} gameSession - Reference to the main game session.
     */
    constructor(gameSession) {
        this.gs = gameSession;

        // Model Pools
        this.modelPool = new Map();
        this.unusedModels = [];
        this.gunPool = [];
        this.zurgModels = [];

        // All active meshes in the scene
        this.meshes = [];

        // Loading functions (to be initialized)
        this.loadDurgModel = null;
        this.loadZurgModel = null;
        this.loadM1Garrand = null;
        this.loadThompson = null;
        this.loadRifle = null;
    }

    /**
     * Initializes the manager with loading functions and fills initial pools.
     * @param {Object} event - The scene initialization event data.
     */
    async initialize(event) {
        this.loadDurgModel = event.loadDurgModel;
        this.loadZurgModel = event.loadZurgModel;
        this.loadM1Garrand = event.loadM1Garrand;
        this.loadThompson = event.loadThompson;
        this.loadRifle = event.loadRifle;
        this.meshes = event.meshes;

        await Promise.all([
            this.fillZurgPool(15),
            this.fillDurgPool(10),
            this.fillGunPool(10)
        ]);
    }

    /**
     * Fills the Zurg (zombie) model pool.
     * @param {Number} count
     */
    async fillZurgPool(count) {
        for (let i = 0; i < count; i++) {
            try {
                const mesh = await this.loadZurgModel();
                if (this.gs._disposed) return;

                const index = this.zurgModels.push(mesh) - 1;
                mesh.name = "zurg" + index;
                mesh.metadata = { zid: index, health: -1 };
                this.meshes.push(mesh);
            } catch (error) {
                console.error("Error loading Zurg model:", error);
            }
        }
    }

    /**
     * Fills the Durg (player) model pool.
     * @param {Number} count
     */
    async fillDurgPool(count) {
        for (let i = 0; i < count; i++) {
            try {
                const mesh = await this.loadDurgModel();
                if (this.gs._disposed) return;

                mesh.setPosition(0, -5, 0);
                mesh.metadata = { armed: false, gunModel: null };
                this.meshes.push(mesh);
                this.unusedModels.push(mesh);
            } catch (error) {
                console.error("Error loading Durg model:", error);
            }
        }
    }

    /**
     * Fills the gun model pool.
     * @param {Number} count
     */
    async fillGunPool(count) {
        for (let i = 0; i < count; i++) {
            try {
                const m1Mesh = await this.loadM1Garrand();
                if (this.gs._disposed) return;

                m1Mesh.turnY(Math.PI / 180);
                m1Mesh.setPosition(-50 + (10 * i), -20, 0);
                this.meshes.push(m1Mesh);
                this.gunPool.push(m1Mesh);
            } catch (error) {
                console.error("Error loading Gun model:", error);
            }
        }
    }

    /**
     * Disposes of all pools and references.
     */
    dispose() {
        this.modelPool.clear();
        this.unusedModels = [];
        this.zurgModels = [];
        this.gunPool = [];
        this.meshes = null;
        this.loadDurgModel = null;
        this.loadZurgModel = null;
        this.loadM1Garrand = null;
        this.loadThompson = null;
        this.loadRifle = null;
    }
}
