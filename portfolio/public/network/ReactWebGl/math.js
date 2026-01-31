export const webglMath = {
    // SOME USEFUL FUNCTIONS
    add: (a, b) => { let v = []; for (let i = 0; i < a.length; i++) v.push(a[i] + b[i]); return v; },
    cross: (a, b) => { [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]] },
    dot: (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; },
    ease: t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - t - t); },
    evalBezier: (B, t) => { (1 - t) * (1 - t) * (1 - t) * B[0] + 3 * (1 - t) * (1 - t) * t * B[1] + 3 * (1 - t) * t * t * B[2] + t * t * t * B[3] },
    mix: (a, b, t) => { let c = []; for (let i = 0; i < a.length; i++) c[i] = a[i] + t * (b[i] - a[i]); return c; },
    norm: v => Math.sqrt(dot(v, v)),
    normalize: v => { let s = norm(v); return v.length == 3 ? [v[0] / s, v[1] / s, v[2] / s] : [v[0] / s, v[1] / s]; },
    resize: (v, s) => { v.length == 2 ? [s * v[0], s * v[1]] : [s * v[0], s * v[1], s * v[2]] },
    subtract: (a, b) => { let v = []; for (let i = 0; i < a.length; i++) v.push(a[i] - b[i]); return v; },

    // THIS IS A SIMPLE IMPLEMENTATION OF THE OPERATIONS NEEDED FOR MATRIX MANIPULATION.
    c: t => Math.cos(t),
    s: t => Math.sin(t),
    identity: () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    move: (x, y, z) => {
        if (y === undefined) { z = x[2]; y = x[1]; x = x[0]; };
        return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1];
    },
    turnX: t => [1, 0, 0, 0, 0, c(t), s(t), 0, 0, -s(t), c(t), 0, 0, 0, 0, 1],
    turnY: t => [c(t), 0, -s(t), 0, 0, 1, 0, 0, s(t), 0, c(t), 0, 0, 0, 0, 1],
    turnZ: t => [c(t), s(t), 0, 0, -s(t), c(t), 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    scale: (x, y, z) => [x, 0, 0, 0, 0, y ?? x, 0, 0, 0, 0, z ?? x, 0, 0, 0, 0, 1],
    perspective: (x, y, z) => [1, 0, 0, x, 0, 1, 0, y ?? x, 0, 0, 1, z ?? x, 0, 0, 0, 1],
    // Multiply two matrices.
    mxm: (a, b) => {
        let m = [];
        for (let c = 0; c < 16; c += 4)
            for (let r = 0; r < 4; r++)
                m.push(a[r] * b[c] + a[r + 4] * b[c + 1] + a[r + 8] * b[c + 2] + a[r + 12] * b[c + 3]);
        return m;
    },
    // A matrix transforms a point

    transform: (m, p) => {
        let x = p[0], y = p[1], z = p[2], w = p[3] ?? 1;
        return [
            m[0] * x + m[4] * y + m[8] * z + m[12] * w,
            m[1] * x + m[5] * y + m[9] * z + m[13] * w,
            m[2] * x + m[6] * y + m[10] * z + m[14] * w,
            m[3] * x + m[7] * y + m[11] * z + m[15] * w,
        ];
    },
    // Invert a matrix.

    inverse: src => {
        let dst = [], det = 0, cofactor = (c, r) => {
            let s = (i, j) => src[c + i & 3 | (r + j & 3) << 2];
            return (c + r & 1 ? -1 : 1) * ((s(1, 1) * (s(2, 2) * s(3, 3) - s(3, 2) * s(2, 3)))
                - (s(2, 1) * (s(1, 2) * s(3, 3) - s(3, 2) * s(1, 3)))
                + (s(3, 1) * (s(1, 2) * s(2, 3) - s(2, 2) * s(1, 3))));
        }
        for (let n = 0; n < 16; n++) dst.push(cofactor(n >> 2, n & 3));
        for (let n = 0; n < 4; n++) det += src[n] * dst[n << 2];
        for (let n = 0; n < 16; n++) dst[n] /= det;
        return dst;
    },
    // Rotation matrix which brings the Z axis to a specified direction.

    aim: Z => {
        let X = normalize(cross([0, 1, 0], Z = normalize(Z))),
            Y = normalize(cross(Z, X));
        return [X[0], X[1], X[2], 0, Y[0], Y[1], Y[2], 0, Z[0], Z[1], Z[2], 0, 0, 0, 0, 1];
    }
};
// NESTABLE MATRIX OBJECT

export function PMatrix() {
   let m = [identity()], top = 0;
   this.aim         = Z       => { m[top] = mxm(m[top],aim(Z)); return this; }
   this.call        = proc    => { proc(); return this; }
   this.get         = ()      => m[top];
   this.identity    = ()      => { m[top] = identity(); return this; }
   this.inverse     = ()      => { m[top] = inverse(m[top]); return this; }
   this.move        = (x,y,z) => { m[top] = mxm(m[top],move(x,y,z)); return this; }
   this.perspective = (x,y,z) => { m[top] = mxm(m[top], perspective(x,y,z)); return this; }
   this.pop         = ()      => { if (top > 0) top--; return this; }
   this.push        = ()      => { m[top+1] = m[top].slice(); top++; return this; }
   this.scale       = (x,y,z) => { m[top] = mxm(m[top], scale(x,y,z)); return this; }
   this.set         = matrix  => { m[top] = matrix; return this; }
   this.transform   = p       => { m[top] = transform(m[top],p); return this; }
   this.transpose   = ()      => { m[top] = transpose(m[top]); return this; }
   this.turnX       = a       => { m[top] = mxm(m[top], turnX(a)); return this; }
   this.turnY       = a       => { m[top] = mxm(m[top], turnY(a)); return this; }
   this.turnZ       = a       => { m[top] = mxm(m[top], turnZ(a)); return this; }
}












