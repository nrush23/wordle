class Matrix {
    m;
    constructor(M = new Float32Array([])) {
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
            let s = (i, j) => this.m[(c + i) & 3 | ((r + j) & 3) << 2];
            return ((c + r) & 1 ? -1 : 1) * ((s(1, 1) * (s(2, 2) * s(3, 3) - s(3, 2) * s(2, 3)))
                - (s(2, 1) * (s(1, 2) * s(3, 3) - s(3, 2) * s(1, 3)))
                + (s(3, 1) * (s(1, 2) * s(2, 3) - s(2, 2) * s(1, 3))));
        }
        for (let n = 0; n < 16; n++) dst.push(cofactor(n >> 2, n & 3));
        for (let n = 0; n < 4; n++) det += this.m[n] * dst[n << 2];
        for (let n = 0; n < 16; n++) dst[n] /= det;
        return new Matrix(dst);
    }

    identity(size = 4) {
        if (size == 4) {
            return new Matrix([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
        }
        return new Matrix([1, 0, 0, 0, 1, 0, 0, 0, 1]);
    }

    perspective(x = 0, y = 0, z = 0) {
        let P = new Matrix([1, 0, 0, x, 0, 1, 0, y, 0, 0, 1, z, 0, 0, 0, 1]);
        return P;
    }
}

class Mesh {
    m;
    T;
    R;
    S;
    Q;
    COLOR = [0, 0, 0, 1];
    V;
    constructor(M = new Float32Array([])) {
        this.m = new Matrix(M);
        this.V = M;
        this.T = new Matrix().identity();
        this.R = new Matrix().identity();
        this.S = new Matrix().identity();
        this.Q = new Matrix().identity();
    }

    move(x, y, z) {
        let M2 = new Matrix([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]);
        this.T = M2.mxm(this.T)
        this.bake();
        return this.m;
    }

    setPosition(x, y, z) {
        let M2 = new Matrix([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]);
        this.T = M2;
        this.bake();
    }

    scale(x = 1, y = 1, z = 1) {
        let M2 = new Matrix([x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1]);
        this.S = M2.mxm(this.S);
        this.bake()
        return this.m;
    }

    turn(x = 0, y = 0, z = 0) {
        this.turnX(x, true);
        this.turnY(y, true);
        return this.turnZ(z);
    }

    turnX(x = 0, chain = false) {
        let RX = new Matrix([1, 0, 0, 0, 0, Math.cos(x), -Math.sin(x), 0, 0, Math.sin(x), Math.cos(x), 0, 0, 0, 0, 1]);
        this.R = RX.mxm(this.R);
        this.bake();
        if (!chain) {
            return this.m;
        }
    }

    turnY(y = 0, chain = false) {
        let RY = new Matrix([Math.cos(y), 0, Math.sin(y), 0, 0, 1, 0, 0, -Math.sin(y), 0, Math.cos(y), 0, 0, 0, 0, 1]);
        this.R = RY.mxm(this.R);
        this.bake();
        if (!chain) {
            return this.m;
        }
    }

    turnZ(z = 0, chain = false) {
        let RZ = new Matrix([Math.cos(z), Math.sin(z), 0, 0, -Math.sin(z), Math.cos(z), 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
        this.R = RZ.mxm(this.R);
        this.bake();
        if (!chain) {
            return this.m;
        }
    }

    bake(apply = false) {
        let M = this.T.mxm(this.R.mxm(this.S));
        // this.qxm(M, apply);
        this.Q = M;
        this.QI = M.inverse();
    }

    applyAll() {
        this.bake(true);
        this.resetTransforms();
    }

    resetTransforms() {
        this.T = new Matrix().identity();
        this.R = new Matrix().identity();
        this.S = new Matrix().identity();
    }

    clearRotation() {
        this.R = new Matrix().identity();
        this.bake();
    }

    qxm(M, apply = true) {
        let MI = M.inverse();
        this.Q = MI.transpose().mxm(this.m.mxm(MI)).m;
        if (apply) {
            this.m = MI.transpose().mxm(this.m.mxm(MI)).m;
        }
        return this.Q;
    }
}

class Cube extends Mesh {
    constructor() {
        super(new Float32Array([
            -1, -1, -1, 0, 0, -1, 1, -1, -1, 0, 0, -1, 1, 1, -1, 0, 0, -1,
            1, 1, -1, 0, 0, -1, -1, 1, -1, 0, 0, -1, -1, -1, -1, 0, 0, -1,
            -1, -1, 1, 0, 0, 1, 1, -1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1,
            1, 1, 1, 0, 0, 1, -1, 1, 1, 0, 0, 1, -1, -1, 1, 0, 0, 1,

            -1, -1, -1, 0, -1, 0, 1, -1, -1, 0, -1, 0, 1, -1, 1, 0, -1, 0,
            1, -1, 1, 0, -1, 0, -1, -1, 1, 0, -1, 0, -1, -1, -1, 0, -1, 0,
            -1, 1, -1, 0, 1, 0, 1, 1, -1, 0, 1, 0, 1, 1, 1, 0, 1, 0,
            1, 1, 1, 0, 1, 0, -1, 1, 1, 0, 1, 0, -1, 1, -1, 0, 1, 0,

            -1, -1, -1, -1, 0, 0, -1, 1, -1, -1, 0, 0, -1, 1, 1, -1, 0, 0,
            -1, 1, 1, -1, 0, 0, -1, -1, 1, -1, 0, 0, -1, -1, -1, -1, 0, 0,
            1, -1, -1, 1, 0, 0, 1, 1, -1, 1, 0, 0, 1, 1, 1, 1, 0, 0,
            1, 1, 1, 1, 0, 0, 1, -1, 1, 1, 0, 0, 1, -1, -1, 1, 0, 0,
        ]))
    }
}