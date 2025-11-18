/**
 * @param {*} canvas 
 */

function Scene(canvas) {
   this.yaw = 0;
   this.pitch = 0;
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

   let createPathsMesh = (width, paths) => {
      let vertices = [];
      let addVertex = pos => vertices.push(pos, [0, 0, 1]);
      for (let n = 0; n < paths.length; n++) {
         let path = paths[n];
         for (let i = 0; i < path.length - 1; i++) {
            let b = path[i];
            let c = path[i + 1];
            let a = i > 0 ? path[i - 1] : add(b, subtract(b, c));
            let da = normalize(subtract(b, a));
            let dc = normalize(subtract(c, b));
            let db = normalize(add(da, dc));
            let s = dot(da, db);
            da = resize(da, width / 2);
            dc = resize(dc, width / 2);
            db = resize(db, width / 2);
            let ea = [-da[1], da[0], 0];
            let ec = [-dc[1], dc[0], 0];
            let eb = [-db[1] / s, db[0] / s, 0];
            if (i == 0)
               b = subtract(b, da);
            if (dot(da, dc) < 0) {
               if (n > 0 && i == 0)
                  addVertex(subtract(b, ea));
               addVertex(subtract(b, ea));
               addVertex(add(b, ea));
               addVertex(subtract(b, ec));
               addVertex(add(b, ec));
            }
            else {
               if (n > 0 && i == 0)
                  addVertex(subtract(b, eb));
               addVertex(subtract(b, eb));
               addVertex(add(b, eb));
            }
            if (i == path.length - 2) {
               addVertex(subtract(add(c, dc), ec));
               addVertex(add(add(c, dc), ec));
            }
            if (n < paths.length - 1 && i == path.length - 2)
               addVertex(add(add(c, dc), ec));
         }
      }
      return {
         triangle_strip: true,
         data: new Float32Array(vertices.flat())
      }
   }

   this.LEFT = false;
   this.RIGHT = false;
   this.UP = false;
   this.DOWN = false;

   function rgb(r, g, b, a) {
      return [r / 255, g / 255, b / 255, a];
   }

   function createWorld() {
      let background = new Cube();
      background.scale(50, 50, 50);
      background.COLOR = rgb(0, 0, 0, 1);
      return background;
   }

   let makeRoom = async () => {
      const FILES = ['room2', 'floor', 'furniture_alpha8'];
      // const FILE = "room.ply";
      const PATH = "/hw10/models/";
      let MESHES = [];

      for (let i = 0; i < FILES.length; i++){
         let data = await Parser.importMesh(PATH, FILES[i] + '.ply', true);
         addTexture(i, '/hw10/textures/', FILES[i] + '.png');
         MESHES.push(new Mesh(data, false, false, 8, i));
      }
      
      return MESHES;
   };

   let makeDurg = async () => {
      const FILE = "durg.ply";
      const PATH = "/hw10/models/";

      let data = await Parser.importMesh(PATH, FILE, true);

      let M = new Mesh(data, false, false, 8, 3);
      // M.COLOR = rgb(-255, -255, -255, -1);

      addTexture(3, '/hw10/textures/', 'skin1.png');

      return M;
   }


   this.canvas = canvas;

   // this.meshes = [createWorld()];
   this.meshes = [];

   function createGround() {
      let GROUND = new Cube();
      GROUND.scale(21, 0.2, 21);
      GROUND.move(0, -0.55, 1);
      GROUND.COLOR = rgb(255, 0, 255, 1);
      return GROUND;
   }

   function createArms() {
      let LEFT_ARM = new Cube(true);
      LEFT_ARM.scale(0.01, 0.01, 0.1);
      LEFT_ARM.applyAll();
      LEFT_ARM.move(-3, -5.2, -1.8);
      LEFT_ARM.COLOR = rgb(255, 0, 0, 1);

      let RIGHT_ARM = new Cube(true);
      RIGHT_ARM.scale(0.01, 0.01, 0.1);
      RIGHT_ARM.applyAll();
      RIGHT_ARM.move(3, -5.2, -1.8);
      RIGHT_ARM.COLOR = rgb(255, 0, 0, 1);
      return [LEFT_ARM, RIGHT_ARM];
   }


   this.GROUND = createGround();
   // this.meshes = this.meshes.concat(this.GROUND);
   const ARMS = createArms();
   this.meshes.push(ARMS);
   this.meshes = this.meshes.flat();

   this.P = new Matrix()

   this.vertexShader = `\
#version 300 es
uniform mat4 uMF, uMI, uMP, uMV;
uniform bool uUV;
in  vec3 aPos, aNor;
in vec2 aUV;

out vec3 vPos, vNor;
out vec2 vUV;
void main() {
   vec4 pos = uMF * vec4(aPos, 1.);
   vec4 nor = vec4(aNor, 0.) * uMI;
   gl_Position = uMP * uMV * pos;
   vPos = pos.xyz;
   vNor = nor.xyz;
   vUV = aUV;
}`;

   this.fragmentShader = `\
#version 300 es
precision highp float;
uniform vec4 uC;
uniform float uTime;
uniform int uID;
uniform sampler2D uSampler[4]; //U, V SAMPLER
in  vec3 vPos, vNor;
in vec2 vUV;

out vec4 fragColor;


void main() {
   //First color the background
   vec3 nor = normalize(vNor);
   vec3 L = vec3(0.0,0.5,0.0);
   float c_s = 0.5 + max(0., dot(normalize(L),nor));

   //No color means use texture
   if (uC == vec4(-1.0)){
      vec4 T;
      if (uID == 0){
       T = texture(uSampler[0], vUV);
      }else if (uID == 1){
         T = texture(uSampler[1], vUV);
      }else if (uID == 2){
         T = texture(uSampler[2], vUV);
      }else{
         T = texture(uSampler[3], vUV);
      }
      fragColor = vec4(sqrt(c_s)*T.rgb, 1.);
   }else{
      fragColor = uC * vec4(c_s,c_s,c_s, uC.a);
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
      vertexMap(['aPos', 3, 'aNor', 3, 'aUV', 2]);

      setUniform('1iv', 'uSampler', [0, 1, 2, 3]);
      let ROOM = await makeRoom();
      // let data = await Parser.importMesh("/hw10/models/", "cube2.ply", true);
      // console.log(data);
      ROOM.forEach(mesh => {
         this.meshes.push(mesh);
      })
      // this.meshes.push(ROOM);

      let DURG = await makeDurg();

      DURG.move(0, 1, 0);
      this.meshes.push(DURG);

      DURG.animate = (time) => {
         DURG.setPosition(Math.cos(time), 1, Math.sin(time));
      }

      let P = persp(Math.PI / 4, this.canvas.width / this.canvas.height, 0.1, 100);
      setUniform('Matrix4fv', 'uMP', false, P.m);

      this.C = new Mesh();
      this.C.bake();
      ARMS.forEach(arm => {
         arm.setParent(this.C);
      });

      this.C.move(0, 2, 3);
      setUniform('Matrix4fv', 'uMV', false, this.C.QI.m);

      // this.meshes = this.meshes.flat();
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

      if (evt.key === ' ' || evt.key === 'Shift') {
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


      if (evt.key === ' ') {
         this.RISE = 'UP';
      } else if (evt.key === 'Shift') {
         this.RISE = 'DOWN';
      }

   }, false], ['mousemove', (evt) => {
      if (this.C) {

         //Treat rotation like velocity + position update
         const V = 0.005 * 4;
         if (Math.abs(evt.movementX) < Math.abs(evt.movementY)) {
            this.pitch += evt.movementY * V;
            this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch));
         } else {
            this.yaw += evt.movementX * V;
         }

         this.C.clearRotation();
         this.C.turnX(this.pitch);
         this.C.turnY(this.yaw);
         this.updateCam();
      }
   }], ['click', async (evt) => {
      await this.canvas.requestPointerLock();
   }]];

   this.update = () => {
      let time = Date.now() / 1000;
      this.updateMovement(time);
      COLOR = rgb(127.5 * Math.sin(time) + 127.5, 0, 0);
      this.GROUND.COLOR = COLOR;
      setUniform('1f', 'uTime', time - startTime);
      this.reloadShapes();
      prev = time;
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
         this.C.move(x * this.C.Q.m[0] + -this.C.Q.m[8] * y, z * delta, -y * this.C.Q.m[10] + x * this.C.Q.m[2]);
         const POS = this.C.getPosition();
         POS.x = Math.max(-20, Math.min(20, POS.x));
         POS.z = Math.max(-19, Math.min(19, POS.z));
         POS.y = Math.max(0, Math.min(20, POS.y));
         this.C.setPosition(POS.x, POS.y, POS.z);
         this.updateCam();
      }
   }


   this.reloadShapes = () => {
      const N = this.meshes.length;
      for (let i = 0; i < N; i++) {
         let mesh = this.meshes[i];
         if (mesh.animate) {
            mesh.animate(Date.now() / 1000);
         }
         let M = mesh.getWorldMatrix();
         setUniform('Matrix4fv', 'uMF', false, M);
         setUniform('Matrix4fv', 'uMI', false, inverse(M));
         setUniform('4fv', 'uC', mesh.COLOR);
         if (mesh.textID != -1) {
            setUniform('1i', 'uID', mesh.textID);
         }
         drawMesh(mesh.mesh);
      }
   }

}

console.log("hw10.js loaded");