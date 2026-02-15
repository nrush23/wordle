export default class Vector3 {
    constructor(x, y, z) {
        this.x = x ?? 0;
        this.y = y ?? 0;
        this.z = z ?? 0;
    }
    static distance(a, b) {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dz = b.z - a.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    static moveTowards(start, goal, maxDistance) {
        const dx = goal.x - start.x;
        const dy = goal.y - start.y;
        const dz = goal.z - start.z;

        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

        // If already at the goal or within range, return goal
        if (distance === 0 || distance <= maxDistance) {
            return { x: goal.x, y: goal.y, z: goal.z };
        }

        const t = maxDistance / distance;

        return {
            x: start.x + dx * t,
            y: start.y + dy * t,
            z: start.z + dz * t
        };
    }
    /** @param {Vector3} vec3  */
    copy(vec3){
        this.x = vec3.x;
        this.y = vec3.y;
        this.z = vec3.z;
    }
}