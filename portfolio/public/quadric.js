class Quadric {
    M;
    constructor(A, B, C, D, E, F, G, H, I, J) {
        this.M = [[A, B, C, D], [0, E, F, G], [0, 0, H, I], [0, 0, 0, J]];
        this.M = this.M.flat();
    }

    move(x, y, z) {
        let M2 = [1, 0, 0, x, 0, 1, 0, y, 0, 0, 1, z, 0, 0, 0, 1];
        this.M = this.mxm(M2);
    }

    mxm(M2) {
        let m = Array(16);
        for (let c = 0; c < 16; c += 4) {
            for (let r = 0; r < 4; r++) {
                m[r * 4 + c] = this.M[r] * M2[c] + this.M[r + 4] * M2[c + 1] + this.M[r + 8] * M2[c + 2] + M[r + 12] * M2[c + 3];
            }
        }
        return m;
    }

    transpose() {
        return [this.M[0], this.M[4], this.M[8], this.M[12], this.M[1], this.M[5], this.M[9], this.M[13], this.M[2], this.M[6], this.M[10], this.M[14], this.M[3], this.M[7], this.M[11], this.M[15]];
    }

    inverse() {
        let dst = [], det = 0, cofactor = (c, r) => {
            let s = (i, j) => this.M[c + i & 3 | (r + j & 3) << 2];
            return (c + r & 1 ? -1 : 1) * ((s(1, 1) * (s(2, 2) * s(3, 3) - s(3, 2) * s(2, 3)))
                - (s(2, 1) * (s(1, 2) * s(3, 3) - s(3, 2) * s(1, 3)))
                + (s(3, 1) * (s(1, 2) * s(2, 3) - s(2, 2) * s(1, 3))));
        }
        for (let n = 0; n < 16; n++) dst.push(cofactor(n >> 2, n & 3));
        for (let n = 0; n < 4; n++) det += this.M[n] * dst[n << 2];
        for (let n = 0; n < 16; n++) dst[n] /= det;
        return dst;
    }

    qxm(Q){
        let MI = this.inverse(this.M);
        return this.mxm(this.transpose(MI), this.mxm(Q, MI));
    }
}