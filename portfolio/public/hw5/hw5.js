/**
 * CODE FOR PERSPECTIVE TAKEN FROM: https://webglfundamentals.org/webgl/lessons/webgl-3d-perspective.html
 * CODE FOR CAMERA MOVEMENT TAKEN FROM: https://webglfundamentals.org/webgl/lessons/webgl-3d-camera.html
 * CODE FOR PARENTING TAKEN FROM: https://webglfundamentals.org/webgl/lessons/webgl-scene-graph.html
 * CODE FOR STRAFING, COMBO OF THESE TWO: https://stackoverflow.com/questions/66874183/unity3d-character-not-moving-in-the-direction-its-facing, https://www.3dgep.com/understanding-the-view-matrix/
 * @param {*} canvas 
 */

function Scene(canvas) {

   this.LEFT = false;
   this.RIGHT = false;
   this.UP = false;
   this.DOWN = false;
   this.SPIN = true;
   this.SPIRAL = false;
   this.CUBES_X = 0;
   function rgb(r, g, b, a) {
      return [r / 255, g / 255, b / 255, a];
   }

   let C1 = new Cube();
   this.canvas = canvas;

   C1.scale(0.3, 0.3, 0.3);
   C1.move(0, 0, 0);
   C1.animate = (t) => {
      C1.clearRotation();
      C1.turnY(t - startTime);
      C1.turnX(t - startTime);
   }
   C1.COLOR = rgb(255, 0, 0, 1);


   // let C2 = new Cube();
   // C2.scale(0.3, 0.3, 0.3);
   // C2.move(0, 0, -3);
   // C2.COLOR = rgb(0, 0, 255, 1);

   // C2.animate = (t) => {
   //    let delta = t - prev;
   //    C2.move(0, 0, -0.5 * delta);
   // }
   this.meshes = [C1];

   function createGround() {
      let GROUND = new Cube();
      GROUND.scale(10, 0.1, 10);
      GROUND.move(0, -0.6, 0);
      GROUND.COLOR = rgb(144, 199, 164, 1);
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
         Cubes[i].COLOR = rgb(145,224,244, 10);
         Cubes[i].applyAll();

         Cubes[i].setParent(this.CENTER);
      }
      this.CENTER.move(0,0,-0.5);
      return Cubes;
   }


   this.GROUND = createGround();
   this.meshes = this.meshes.concat(this.GROUND);
   const ARMS = createArms();
   this.meshes = this.meshes.concat(ARMS);


   const WALLS = createRoom();

   let ROOM = new Mesh();
   ROOM.applyAll();
   for (let i = 0; i < WALLS.length; i++) {
      WALLS[i].setParent(ROOM);
   }
   this.GROUND.setParent(ROOM);

   ROOM.animate = (t) => {
      if (!this.SPIN) {
         return;
      }
      let delta = t - prev;
      ROOM.turnY(delta);
   }
   this.meshes = this.meshes.concat(WALLS);
   this.meshes.push(ROOM);

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
in  vec3 vPos, vNor;
out vec4 fragColor;

void main() {
   vec3 nor = normalize(vNor);
   float c = .5 + max(0., dot(vec3(1.0),nor));
   fragColor = uC * vec4(c,c,c, 1.);
}`;

   let startTime = Date.now() / 1000;
   let prev = startTime;
   autodraw = false;

   function persp(fieldOfViewInRadians, aspect, near, far) {
      let f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewInRadians);
      let rangeInv = 1.0 / (near - far);
      return new Matrix([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (near + far) * rangeInv, -1, 0, 0, near * far * rangeInv * 2, 0]);
   }

   this.initialize = () => {
      let P = persp(Math.PI / 4, this.canvas.width / this.canvas.height, 0.1, 100);
      setUniform('Matrix4fv', 'uMP', false, P.m);

      this.C = new Mesh();
      this.C.bake();
      ARMS.forEach(arm => {
         arm.setParent(this.C);
      });
      this.CENTER.setParent(this.C);

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

   }, false], ['mousemove', (evt) => {
      if (!this.SHOOT) {

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
      this.SPIRAL = true;
      // setTimeout(() => {
      //    this.SPIRAL = false;
      // }, 1000);
   }]];

   this.update = () => {
      let time = Date.now() / 1000;
      this.updateMovement(time);
      if (this.SPIRAL && this.CUBES) {
         this.animateSpiral(time);
      }else{
         this.initializeCubes();
      }
      this.reloadShapes();
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
         const V = { x: 4, y: 4 };
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


         this.C.move(x * this.C.Q.m[0] + -this.C.Q.m[8] * y, 0, -y * this.C.Q.m[10] + x * this.C.Q.m[2]);
         this.updateCam();

         // this.reloadShapes();
      }
   }

   this.reloadShapes = () => {
      // this.meshes.forEach(mesh => {
      const N = this.SPIRAL ? this.meshes.length : this.CUBES;
      for (let i = 0; i < N; i++) {
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
      // })
      // prev = Date.now() / 1000;
   }

}