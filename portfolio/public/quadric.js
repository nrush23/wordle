class Matrix {
    m;
    constructor(M = Array(16).fill(0)) {
        this.m = M;
    }

    transpose() {
        return new Matrix([this.m[0], this.m[4], this.m[8], this.m[12], this.m[1], this.m[5], this.m[9], this.m[13], this.m[2], this.m[6], this.m[10], this.m[14], this.m[3], this.m[7], this.m[11], this.m[15]]);
    }

    mxm(M2) {
        let m = [];
        for (let c = 0; c < 16; c += 4)
            for (let r = 0; r < 4; r++)
                m.push(this.m[r] * M2.m[c] + this.m[r + 4] * M2.m[c + 1] + this.m[r + 8] * M2.m[c + 2] + this.m[r + 12] * M2.m[c + 3]);
        return new Matrix(m);
    }

    inverse() {
        let dst = [], det = 0, cofactor = (c, r) => {
            let s = (i, j) => this.m[c + i & 3 | (r + j & 3) << 2];
            return (c + r & 1 ? -1 : 1) * ((s(1, 1) * (s(2, 2) * s(3, 3) - s(3, 2) * s(2, 3)))
                - (s(2, 1) * (s(1, 2) * s(3, 3) - s(3, 2) * s(1, 3)))
                + (s(3, 1) * (s(1, 2) * s(2, 3) - s(2, 2) * s(1, 3))));
        }
        for (let n = 0; n < 16; n++) dst.push(cofactor(n >> 2, n & 3));
        for (let n = 0; n < 4; n++) det += this.m[n] * dst[n << 2];
        for (let n = 0; n < 16; n++) dst[n] /= det;
        return new Matrix(dst);
    }
}

class Quadric extends Matrix {
    pos = {x:0, y:0, z:0};
    constructor(A = 0, B = 0, C = 0, D = 0, E = 0, F = 0, G = 0, H = 0, I = 0, J = 0) {
        // let M = [[A, B, C, D], [0, E, F, G], [0, 0, H, I], [0, 0, 0, J]].flat();
        let M = [[A, 0, 0, 0], [B, E, 0, 0], [C, F, H, 0], [D, G, I, J]].flat();
        super(M);
    }

    move(x, y, z) {
        this.pos += x;
        this.poz += y;
        this.poz += z;

        let M2 = new Matrix([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]);
        this.qxm(M2);
        return this.m;
    }

    scale(x = 1, y = 1, z = 1) {
        let M2 = new Matrix([x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1]);
        this.qxm(M2);
        return this.m;
    }

    turn(x = 0, y = 0, z = 0) {
        this.turnX(x, true);
        this.turnY(y, true);
        return this.turnZ(z);
    }

    turnX(x = 0, chain = false) {
        let RX = new Matrix([1, 0, 0, 0, 0, Math.cos(x), -Math.sin(x), 0, 0, Math.sin(x), Math.cos(x), 0, 0, 0, 0, 1]);
        this.qxm(RX);
        if (!chain) {
            return this.m;
        }
    }

    turnY(y = 0, chain = false) {
        let RY = new Matrix([Math.cos(y), 0, Math.sin(y), 0, 0, 1, 0, 0, -Math.sin(y), 0, Math.cos(y), 0, 0, 0, 0, 1]);
        this.qxm(RY);
        if (!chain) {
            return this.m;
        }
    }

    turnZ(z = 0, chain = false) {
        let RZ = new Matrix([Math.cos(z), Math.sin(z), 0, 0, -Math.sin(z), Math.cos(z), 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
        this.qxm(RZ);
        if (!chain) {
            return this.m;
        }
    }

    qxm(M) {
        let MI = M.inverse();
        this.m = MI.transpose().mxm(this.mxm(MI)).m;
        // return this.mxm(MI.transpose(), this.mxm(MI));
    }
}

console.log("Loaded Quadric.js");