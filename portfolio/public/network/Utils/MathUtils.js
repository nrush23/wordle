import Vector3 from "../vector3.js";

/**
 * Computes forward, right, and up vectors from a matrix.
 * @param {Array|Float32Array} matrix - The transform matrix.
 * @returns {Object} { forward, right, up } as Vector3 instances.
 */
export const getDirectionalVectors = (matrix) => {
    return {
        forward: new Vector3(-matrix[8], -matrix[9], -matrix[10]),
        right: new Vector3(matrix[0], matrix[1], matrix[2]),
        up: new Vector3(matrix[4], matrix[5], matrix[6])
    };
};

/**
 * Linearly interpolates between two 3D vectors.
 * @param {Object} a - Starting vector {x,y,z}
 * @param {Object} b - Ending vector {x,y,z}
 * @param {Number} t - Interpolation factor (0 to 1)
 * @returns {Object} Interpolated vector {x,y,z}
 */
export function lerpVec3(a, b, t) {
    return {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
        z: a.z + (b.z - a.z) * t
    };
}
