/**
 * General form of a Quadric:
 * Ax² + Bxy + Cxz + Dx +
 *       Ey² + Fyz + Gy +
 *             Hz² + Iz +
 *                   J   =   0
 */

class Sphere extends Quadric {
    PARTS = 1;
    constructor(A = 1, E = 1, H = 1, J = -1) {
        super(A, 0, 0, 0, E, 0, 0, H, 0, J);
    }
}

class Paraboloid extends Quadric {
    PARTS = 1;
    constructor(A = 1, D = 1, E = 1, G = 1, H = 1, I = 1) {
        super(A, 0, 0, D, E, 0, G, H, I, 0);
    }
}

class ParaboloidX extends Paraboloid {
    constructor(D = 1, E = 1, H = 1) {
        super(0, D, E, 0, H, 0);
    }
}

class ParaboloidY extends Paraboloid {
    constructor(A = 1, G = 1, H = 1) {
        super(A, 0, 0, G, H, 0);
    }
}

class ParaboloidZ extends Paraboloid {
    constructor(A = 1, E = 1, I = 1) {
        super(A, 0, E, 0, 0, I);
    }
}

class Tube extends Quadric {
    PARTS = 1;
    constructor(A = 1, E = 1, H = 1, J = -1) {
        super(A, 0, 0, 0, E, 0, 0, H, 0, J);
    }
}

class TubeX extends Tube {
    constructor(E = 1, H = 1, J = -1) {
        super(0, E, H, J);
    }
}

class TubeY extends Tube {
    constructor(A = 1, H = 1, J = -1) {
        super(A, 0, H, J);
    }
}

class TubeZ extends Tube {
    constructor(A = 1, E = 1, J = -1) {
        super(A, E, 0, J);
    }
}

class Slab extends Quadric {
    PARTS = 1;
    constructor(A = 1, E = 1, H = 1, J = -1) {
        super(A, 0, 0, 0, E, 0, 0, H, 0, J);
    }
}

class SlabX extends Slab {
    constructor(A = 1, J = -1) {
        super(A, 0, 0, J);
    }
}

class SlabY extends Slab {
    constructor(E = 1, J = -1) {
        super(0, E, 0, J);
    }
}

class SlabZ extends Slab {
    constructor(H = 1, J = -1) {
        super(0, 0, H, J);
    }
}

class Space extends Quadric {
    PARTS = 1;
    constructor() {
        super(0, 0, 0, 0, 0, 0, 0, 0, 0, -1);
    }
}

class Cube {
    X;
    Y;
    Z;
    children;
    m;
    PARTS = 3;

    pos;
    constructor(W = -1, D = -1, H = -1) {
        this.X = new SlabX();
        this.Y = new SlabY();
        this.Z = new SlabZ();
        this.children = [this.X, this.Y, this.Z];
        this.pos = { x: 0, y: 0, z: 0 };
        this.updateMatrix();
    }

    scale(x, y, z) {
        this.children.forEach(slab => {
            slab.scale(x, y, z);
        });
        this.updateMatrix();
    }

    turnX(x) {
        this.children.forEach(slab => {
            slab.turnX(x);
        })
        this.updateMatrix();
    }

    turnY(y) {
        this.children.forEach(slab => {
            slab.turnY(y);
        })
        this.updateMatrix();
    }

    turnZ(z) {
        this.children.forEach(slab => {
            slab.turnZ(z);
        })
        this.updateMatrix();
    }

    move(x, y, z) {
        this.children.forEach(slab => {
            slab.move(x, y, z);
        });
        this.pos.x += x;
        this.pos.y += y;
        this.pos.z += z;
        this.updateMatrix();
    }

    setPosition(x, y, z) {
        this.children.forEach(slab => {
            slab.setPosition(x, y, z);
        });
        this.pos.x = x;
        this.pos.y = y;
        this.pos.z = z;
        this.updateMatrix();
    }

    clearRotation(){
        this.children.forEach(slab =>{
            slab.clearRotation();
        })
        this.updateMatrix();
    }

    applyAll() {
        this.children.forEach(slab => {
            slab.applyAll();
        });
    }

    updateMatrix() {
        let new_Q = [];
        this.children.forEach(slab => {
            new_Q.push(slab.Q);
        })
        this.Q = new_Q.flat();
    }

}
