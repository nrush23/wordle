/**
 * CODE FOR ROPE PHYSICS: https://nehe.gamedev.net/tutorial/rope_physics/17006/
 * CODE FOR FORCES: https://nehe.gamedev.net/tutorial/introduction_to_physical_simulations/18005/
 * @param {*} canvas 
 */

function Scene(canvas) {
   let evalBezier = (t, BX, BY, BZ, getF = false) => {
      let nk = (BX.length - 1) / 3;

      // MATH TO EVALUATE A POINT ALONG A BEZIER SPLINE

      let M = [[-1, 3, -3, 1], [3, -6, 3, 0], [-3, 3, 0, 0], [1, 0, 0, 0]];
      let T = (a, t) => a[0] * t * t * t + a[1] * t * t + a[2] * t + a[3];
      let Vi = (V, i, t) => V[i] * T(M[i], t);
      let C = (V, t) => Vi(V, 0, t) + Vi(V, 1, t) + Vi(V, 2, t) + Vi(V, 3, t);

      // FIND THE SPLINE SEGMENT AND POSITION IN THE SEGMENT

      let n = nk * t - .001 >> 0;
      let f = nk * t - n;

      // EVAL AND RETURN THE X AND Y COORDINATES OF THE POINT
      if (getF) {
         return [C(BX.slice(3 * n), f), C(BY.slice(3 * n), f), C(BZ.slice(3 * n), f), f];
      }
      return [C(BX.slice(3 * n), f), C(BY.slice(3 * n), f), C(BZ.slice(3 * n), f)];
   }

   this.LEFT = false;
   this.RIGHT = false;
   this.UP = false;
   this.DOWN = false;
   this.SPIN = true;
   this.SPIRAL = false;

   function rgb(r, g, b, a) {
      return [r / 255, g / 255, b / 255, a];
   }

   let CART = new Cube();
   CART.scale(0.025, 0.02, 0.3);
   CART.move(0, -0.04, -0.5);
   CART.COLOR = rgb(153,76,0,1 );

   function createWorld() {
      let background = new Cube();
      background.scale(50, 50, 50);
      background.COLOR = rgb(0, 80, 155, 1);
      return background;
   }


   this.canvas = canvas;

   this.meshes = [ CART];



   function createGround() {
      let GROUND = new Cube();
      GROUND.scale(20, 0.1, 20);
      GROUND.move(0, -0.55, 0);
      GROUND.COLOR = rgb(102, 255, 102, 1);
      return GROUND;
   }

   function createRoom() {
      let LEFT_WALL = new Cube();
      LEFT_WALL.scale(0.1, 1, 10);
      LEFT_WALL.applyAll();
      LEFT_WALL.move(-100, 0.5, 0);

      LEFT_WALL.COLOR = rgb(24, 59, 46, 1);

      let RIGHT_WALL = new Cube();
      RIGHT_WALL.scale(0.1, 1, 10);
      RIGHT_WALL.applyAll();
      RIGHT_WALL.move(100, 0.5, 0);
      RIGHT_WALL.COLOR = rgb(39, 105, 78, 1);

      let BACK_WALL = new Cube();
      BACK_WALL.scale(10, 1, 0.1);
      BACK_WALL.applyAll();
      BACK_WALL.move(0, 0.5, -100);
      BACK_WALL.COLOR = rgb(76, 152, 118, 1);

      let FRONT_WALL = new Cube();
      FRONT_WALL.scale(10, 1, 0.1);
      FRONT_WALL.applyAll();
      FRONT_WALL.move(0, 0.5, 100);
      FRONT_WALL.COLOR = rgb(144, 199, 164, 1);

      let ROOF = new Cube();
      ROOF.scale(10, 0.1, 10);
      ROOF.applyAll();
      ROOF.move(0, 16, 0);
      ROOF.COLOR = rgb(24, 59, 46, 1);



      return [LEFT_WALL, RIGHT_WALL, BACK_WALL, FRONT_WALL, ROOF];
   }

   function createTrees() {
      let TREES = [];
      for (let i = 0; i < 5; i++) {
         let TREE = new Mesh();
         let TRUNK = new Cube();
         TRUNK.scale(0.2, 1, 0.2);
         TRUNK.applyAll();
         TRUNK.move(0, 0.5, 0);
         TRUNK.COLOR = rgb(102, 51, 0, 1);
         TRUNK.setParent(TREE);
         let LEAVES = new Cube();
         LEAVES.scale(0.7, 0.7, 0.7);
         LEAVES.applyAll();
         LEAVES.move(0, 1.5, 0);
         LEAVES.COLOR = rgb(0, 153 + (Math.random() * 10 - 20), 0, 1);
         LEAVES.setParent(TREE);
         TREE.move(- 16, -0.2, Math.random() * 32 - 16);
         TREE.turnY(Math.random() * 0.4 - 0.2);
         TREES = TREES.concat([TRUNK, LEAVES]);
      }

      for (let i = 0; i < 5; i++) {
         let TREE = new Mesh();
         let TRUNK = new Cube();
         TRUNK.scale(0.2, 1, 0.2);
         TRUNK.applyAll();
         TRUNK.move(0, 0.5, 0);
         TRUNK.COLOR = rgb(102, 51, 0, 1);
         TRUNK.setParent(TREE);
         let LEAVES = new Cube();
         LEAVES.scale(0.7, 0.7, 0.7);
         LEAVES.applyAll();
         LEAVES.move(0, 1.5, 0);
         LEAVES.COLOR = rgb(0, 153 + (Math.random() * 10 - 20), 0, 1);
         LEAVES.setParent(TREE);
         TREE.move(20, -0.2, Math.random() * 32 - 16);
         TREE.turnY(Math.random() * 0.4 - 0.2);
         TREES = TREES.concat([TRUNK, LEAVES]);
      }

      for (let i = 0; i < 5; i++) {
         let TREE = new Mesh();
         let TRUNK = new Cube();
         TRUNK.scale(0.2, 1, 0.2);
         TRUNK.applyAll();
         TRUNK.move(0, 0.5, 0);
         TRUNK.COLOR = rgb(102, 51, 0, 1);
         TRUNK.setParent(TREE);
         let LEAVES = new Cube();
         LEAVES.scale(0.7, 0.7, 0.7);
         LEAVES.applyAll();
         LEAVES.move(0, 1.5, 0);
         LEAVES.COLOR = rgb(0, 153 + (Math.random() * 10 - 20), 0, 1);
         LEAVES.setParent(TREE);
         TREE.move(Math.random() * 32 - 16, -0.2, 16);
         TREE.turnY(Math.random() * 0.4 - 0.2);
         TREES = TREES.concat([TRUNK, LEAVES]);
      }

      for (let i = 0; i < 5; i++) {
         let TREE = new Mesh();
         let TRUNK = new Cube();
         TRUNK.scale(0.2, 1, 0.2);
         TRUNK.applyAll();
         TRUNK.move(0, 0.5, 0);
         TRUNK.COLOR = rgb(102, 51, 0, 1);
         TRUNK.setParent(TREE);
         let LEAVES = new Cube();
         LEAVES.scale(0.7, 0.7, 0.7);
         LEAVES.applyAll();
         LEAVES.move(0, 1.5, 0);
         LEAVES.COLOR = rgb(0, 153 + (Math.random() * 10 - 20), 0, 1);
         LEAVES.setParent(TREE);
         TREE.move(Math.random() * 32 - 16, -0.2, -16);
         TREE.turnY(Math.random() * 0.4 - 0.2);
         TREES = TREES.concat([TRUNK, LEAVES]);
      }
      return TREES
   }

   function createArms() {
      let LEFT_ARM = new Cube();
      LEFT_ARM.scale(0.01, 0.01, 0.1);
      LEFT_ARM.applyAll();
      LEFT_ARM.move(-3, -5.2, -1.8);
      LEFT_ARM.COLOR = rgb(255, 255, 255, 1);

      let RIGHT_ARM = new Cube();
      RIGHT_ARM.scale(0.01, 0.01, 0.1);
      RIGHT_ARM.applyAll();
      RIGHT_ARM.move(3, -5.2, -1.8);
      RIGHT_ARM.COLOR = rgb(255, 255, 255, 1);
      return [LEFT_ARM, RIGHT_ARM];
   }


   this.createSpiral = () => {
      const Cubes = new Array(8);
      this.CENTER = new Mesh();
      this.CENTER.applyAll();
      for (let i = 0; i < Cubes.length; i++) {
         Cubes[i] = new Cube();
         Cubes[i].scale(0.05, 0.05, 0.05);
         Cubes[i].COLOR = rgb(145, 224, 244, 10);
         Cubes[i].applyAll();

         Cubes[i].setParent(this.CENTER);
      }
      this.CENTER.move(0, 0, -0.5);
      return Cubes;
   }


   this.GROUND = createGround();
   this.meshes = this.meshes.concat(this.GROUND);
   const ARMS = createArms();
   this.meshes = this.meshes.concat(ARMS);

   this.meshes = this.meshes.concat(createTrees());


   this.CUBES = this.meshes.length;
   this.meshes = this.meshes.concat(this.createSpiral());

   this.P = new Matrix()

   this.vertexShader = `\
#version 300 es
uniform mat4 uMF, uMI, uMP, uMV;
in  vec3 aPos, aNor;
out vec3 vPos, vNor;
void main() {
   vec4 pos = uMF * vec4(aPos, 1.);
   vec4 nor = vec4(aNor, 0.) * uMI;
   gl_Position = uMP * uMV * pos;
   vPos = pos.xyz;
   vNor = nor.xyz;
}`;

   this.fragmentShader = `\
#version 300 es
precision highp float;
uniform vec4 uC;
uniform float uTime;
uniform bool uClouds;
in  vec3 vPos, vNor;
out vec4 fragColor;

float turbulence(vec3 P){
   float f = 0.0, s = 1.0;
   for(int i = 0 ; i < 8; i++){
      float t = noise(s*P);
      f += abs(t) / s;
      s *= 2.0;
      P = vec3(0.866*P.x + 0.5*P.z, P.y + 100.0, -0.5*P.x + 0.866*P.z);
   }
   return f;
}

void main() {

   //First color the background
   if (uClouds){
      float t = 0.5 + 0.5 * vPos.y;
      if (t > .5)
         t += .3 * turbulence(vPos + vec3(.05*uTime,0.,.1*uTime));
      vec3 c = vec3(0.8,1.,1.);
      c = mix(c, vec3(0.1,0.,0.0), min(t,.5));
      if (t > 0.65)
         c = mix(c, vec3(.2,.1,0.0), (t-.65) / (.7 - .65));
      fragColor = vec4(sqrt(c), 1.);
   }else{
      vec3 nor = normalize(vNor);
      float c_s = .5 + max(0., dot(vec3(1.0),nor));
      fragColor = uC * vec4(c_s,c_s,c_s, 1.);
   }
}`;

   let startTime = Date.now() / 1000;
   let prev = startTime;
   autodraw = false;

   function persp(fieldOfViewInRadians, aspect, near, far) {
      let f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewInRadians);
      let rangeInv = 1.0 / (near - far);
      return new Matrix([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (near + far) * rangeInv, -1, 0, 0, near * far * rangeInv * 2, 0]);
   }

   this.initialize = async () => {
      let P = persp(Math.PI / 4, this.canvas.width / this.canvas.height, 0.1, 100);
      setUniform('Matrix4fv', 'uMP', false, P.m);

      this.C = new Mesh();
      this.C.bake();
      ARMS.forEach(arm => {
         arm.setParent(this.C);
      });
      this.CENTER.setParent(this.C);
      CART.setParent(this.C);

      this.C.move(0, 0, 3);
      setUniform('Matrix4fv', 'uMV', false, this.C.QI.m);
   }

   this.events = [['keyup', (evt) => {
      if (evt.key === 'ArrowLeft' || evt.key === 'a') {
         this.LEFT = false;
      } else if (evt.key === 'ArrowRight' || evt.key === 'd') {
         this.RIGHT = false;
      }
      if (evt.key === 'ArrowUp' || evt.key === 'w') {
         this.UP = false;
      } else if (evt.key === 'ArrowDown' || evt.key === 's') {
         this.DOWN = false;
      }

      if (evt.key === ' ' || evt.key === 'x') {
         this.RISE = 'NONE';
      }
   }, false], ['keydown', (evt) => {

      //If moving left or right, move by delta
      if (evt.key === 'ArrowLeft' || evt.key === 'a') {
         this.LEFT = true;
      } else if (evt.key === 'ArrowRight' || evt.key === 'd') {
         this.RIGHT = true;
      }

      //If moving left or right, move by delta
      if (evt.key === 'ArrowUp' || evt.key === 'w') {
         this.UP = true;
      } else if (evt.key === 'ArrowDown' || evt.key === 's') {
         this.DOWN = true;
      }

      if (evt.key === 'r') {
         this.SPIN = !this.SPIN;
      }

      if (evt.key === ' ') {
         this.RISE = 'UP';
      } else if (evt.key === 'x') {
         this.RISE = 'DOWN';
      }

   }, false], ['mousemove', (evt) => {
      if (this.C) {

         //As long as the ball is not dropping, use the clientX coordinate
         //and dimensions of the canvas to normalize the values from [0,1]
         const canvas = evt.currentTarget;
         const canvasR = canvas.getBoundingClientRect();
         const normX = (evt.clientX - canvasR.left) / canvasR.width;

         //After normalizing, multiply by 2 and subtract by 1 to get coords
         //in the range [-1, 1] to match our WebGL coordinates
         let coord = normX * 2 - 1;

         //Now clamp by the our Sphere Wall boundaries and add our ball radius
         //so it does not overlap
         coord = Math.max(-1, Math.min(1, coord));
         this.C.clearRotation();
         this.C.turnY(coord * Math.PI);
         this.updateCam();
      }
   }], ['click', (evt) => {
      
   }]];

   this.update = () => {
      let time = Date.now() / 1000;
      this.updateMovement(time);
      if (this.SPIRAL && this.CUBES) {
         this.animateSpiral(time);
      } else {
         this.initializeCubes();
      }
      this.reloadShapes();
      setUniform('1f', 'uTime', time);
      prev = time;
   }
   const SPIRAL_N = this.meshes.length - this.CUBES;
   //Travel each cube along a spiral rotate by 2PI/ i degrees
   this.theta_prev = new Array(SPIRAL_N);
   for (let i = 0; i < SPIRAL_N; i++) {
      this.theta_prev[i] = Math.PI * 2 * i / SPIRAL_N;
   }
   this.animateSpiral = (time) => {
      let delta = time - prev;
      let V = { x: 2, y: 2, z: -20 };


      let r = 5;

      for (let i = 0; i < SPIRAL_N; i++) {
         let new_theta = this.theta_prev[i] + V.x * delta;
         const d = { x: r * Math.sin(new_theta) - r * Math.sin(this.theta_prev[i]), y: V.y * delta * (i + 1) / 10, z: r * Math.cos(new_theta) - r * Math.cos(this.theta_prev[i]) + V.z * delta };
         this.meshes[i + this.CUBES].move(d.x, d.y, d.z);
         this.meshes[i + this.CUBES].turnY(d.z);
         this.meshes[i + this.CUBES].turnX(d.x);
         if (this.meshes[i + this.CUBES].getPosition().y >= 15) {
            this.resetCubes();
            return;
         } else {
            this.theta_prev[i] = new_theta;
         }
      }
   }
   this.initializeCubes = () => {
      for (let i = this.CUBES; i < this.meshes.length; i++) {
         this.meshes[i].setPosition(this.CUBES_X, 0, 0);
         this.meshes[i].clearRotation();
      }
   }

   this.resetCubes = () => {
      this.SPIRAL = false;
      for (let i = 0; i < SPIRAL_N; i++) {
         this.theta_prev[i] = Math.PI * 2 * i / SPIRAL_N;
         const pos = this.meshes[i + this.CUBES].getPosition();
         this.meshes[i + this.CUBES].move(-pos.x, -pos.y, -pos.z);
      }
   }

   this.updateCam = () => {
      setUniform('Matrix4fv', 'uMV', false, this.C.QI.m);
   }

   this.updateMovement = (time) => {
      if (this.C) {
         let delta = time - prev;
         const V = { x: 4, y: 4, z: 4 };
         let x = 0;
         let y = 0;

         if (this.LEFT) {
            x = -V.x;
         } else if (this.RIGHT) {
            x = V.x;
         }


         if (this.UP) {
            y = V.y;
         } else if (this.DOWN) {
            y = -V.y;
         }
         y *= delta;
         x *= delta;

         if (x != 0 && y != 0) {
            y /= 2;
            x /= 2;
         }
         if (this.RISE === 'DOWN') {
            z = -V.z;
         } else if (this.RISE === 'UP') {
            z = V.z;
         } else {
            z = 0;
         }

         // let p = evalBezier(time / 20 % 1, BX, BY, BZ);
         // this.C.setPosition(p[0], p[2] + 0.25, p[1]);
         this.C.move(x * this.C.Q.m[0] + -this.C.Q.m[8] * y, z * delta, -y * this.C.Q.m[10] + x * this.C.Q.m[2]);

         this.updateCam();

      }
   }


   this.reloadShapes = () => {
      const N = this.SPIRAL ? this.meshes.length : this.CUBES;
      for (let i = 0; i < N; i++) {
         setUniform('1i', 'uClouds', i == 0 ? 1 : 0);
         let mesh = this.meshes[i];
         if (mesh.animate) {
            mesh.animate(Date.now() / 1000);
         }
         let M = mesh.getWorldMatrix();
         setUniform('Matrix4fv', 'uMF', false, M);
         setUniform('Matrix4fv', 'uMI', false, inverse(M));
         setUniform('4fv', 'uC', mesh.COLOR);
         drawMesh(mesh.mesh);
      }
   }

}

console.log("hw8.js loaded");