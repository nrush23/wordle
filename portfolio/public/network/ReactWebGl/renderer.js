import { Matrix, Cube } from "../../mesh.js";
import Parser from "./parser.js";
import { webglMath, PMatrix } from "./math.js";
import { Mesh } from "../../mesh.js";
import createTextMesh from "./linefont.js";
const LOI = [[8.4, 5.79], [0.06, 5.47], [-0.09, -5.5], [7.25, -0.02], [3.97, -6.36], [4.46, 6.68], [-0.14, 0.03], [-2.55, 7.25], [-4.44, 1.53], [-4.3, -4.77]];

const X_MAX = 38.75;
const Z_MAX = 38.75;
const RADIANS_PER_DEGREE = 0.0174533;
export function rgb(r, g, b, a) {
   return [r / 255, g / 255, b / 255, a];
}
export class Scene {

   constructor(canvas, prefix, gameSession, webGlRenderer) {
      this.webGlRenderer = webGlRenderer;
      this.prefix = prefix;
      //dispose tracking
      this._intervalIds = [];
      this._disposed = false;
      this._unsubs = [];

      this.gameSession = gameSession;

      this.yaw = 0;
      this.pitch = 0;

      //Offsets to calculate our positions into the UV mapping of the sprite sheet
      //N is how many frames we have
      this.XOFF = 0;
      this.YOFF = 0;
      this.frameLimit = 20;// framelimit ?
      this.frame = 0;

      this.canvas = canvas;
      this.MESHES = [];
      this.TEXT_MESHES = [];
      this.P = new Matrix();

      this.LEFT = false;
      this.RIGHT = false;
      this.UP = false;
      this.DOWN = false;

      this.ARMS = this.createArms();
      this.MESHES.push(this.ARMS);
      this.MESHES = this.MESHES.flat();

      this.crosshairMesh = new Cube(true);
      this.crosshairMesh.scale(0.01, 0.01, 0.01); // Make it tiny
      this.crosshairMesh.applyAll();
      
      // Create the data
      this.healthMesh = createTextMesh("hello world!");

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
uniform vec2 uOff;
uniform sampler2D uSampler[6]; //U, V SAMPLER
in  vec3 vPos, vNor;
in vec2 vUV;

out vec4 fragColor;


void main() {
   //First color the background
   vec3 nor = normalize(vNor);
   vec3 L = vec3(0.0,0.5,0.0);
   float c_s = 0.5 + max(0., dot(normalize(L),nor));
   vec4 sky = vec4(0.0);
   //No color means use texture
   if (uC == vec4(-1.0)){
      vec4 T;
      if (uID == 0){
       T = texture(uSampler[0], vUV);
      }else if (uID == 1){
         T = texture(uSampler[1], vUV);
      }else if (uID == 2){
         T = texture(uSampler[2], vUV);
      }else if (uID == 3){
         T = texture(uSampler[3], vUV + uOff);
      }else if (uID == 4){
         T = texture(uSampler[4], vUV);
      }else{
         T = texture(uSampler[5], vUV);
      }
      fragColor = vec4(sqrt(c_s)*T.rgb, 1.);
   }else{
      fragColor = uC * vec4(c_s,c_s,c_s, uC.a);
   }
}`;




      this.startTime = Date.now() / 1000;
      this.previousTime = this.startTime;
      webGlRenderer.autodraw = false;

      //yaw left right
      //pith up down
      this.events = [['mousemove', (evt) => {
         if (this.C) {

            //Treat rotation like velocity + position update
            /*const V = 0.005 * 4;
            if (Math.abs(evt.movementX) < Math.abs(evt.movementY)) {
               this.pitch += evt.movementY * V;
               this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch));
            } else {
               this.yaw += evt.movementX * V;
            }
   
            this.C.clearRotation();
            this.C.turnX(this.pitch);
            this.C.turnY(this.yaw);*/

            // local sensitivity is 1600 dots per inch, aka 1600 degrees per inch
            //let degreesX = (evt.movementX / 1600);
            //let degreesY = (evt.movementY / 1600);

            //this.C.turnY(degreesX,false,false);
            //this.C.turnX(degreesY,false,false);


            // to avoid rotating camera like a plane keep track of local pitch and yaw values and then clamp pitch
            // clear rotations on camera to make sure we are always rotating the exact pitch and yaw values every frame
            this.C.clearRotation();

            // local sensitivity is 1600 dots per inch, aka 1600 degrees per inch

            this.pitch += evt.movementY / 1600;
            this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch));

            this.yaw += evt.movementX / 1600;
            this.C.turnX(this.pitch);
            this.C.turnY(this.yaw);

            this.updateCam();

         }
      }], ['click', async (evt) => {
         await this.canvas.requestPointerLock();
      }]];
   }

   evalBezier(t, BX, BY, BZ, getF = false) {
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

   createPathsMesh(width, paths) {
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





   async makeRoom() {
      const FILES = ['pretty_map', 'ground'];
      const PATH = "/final/models/";

      const SPAWNS = ['sp1', 'sp2', 'sp3', 'sp4', 'sp5', 'sp6', 'sp7'];
      let MESHES = [];

      for (let i = 0; i < FILES.length; i++) {
         let data = await Parser.importMesh(PATH, FILES[i] + '.ply', true);
         this.webGlRenderer.addTexture(i, this.prefix + '/final/textures/', FILES[i] + '.png');
         MESHES.push(new Mesh(data, false, false, 8, i)); //(Map only needs to be flipped vertically)
         // MESHES.push(new Mesh(data, false, false, 8, -1, rgb(255,255,153,1))); //If color
      }

      // //Add in spawns temporarily
      // for(let i = 0; i < SPAWNS.length; i++){
      //    let data = await Parser.importMesh(PATH + '/spawns/', SPAWNS[i] + '.ply', true);
      //    MESHES.push(new Mesh(data, false, false, 8, -1, rgb(0,255,0,1)));
      //    const position = MESHES[MESHES.length-1].getPosition(false);
      //    console.log("Loaded %s.ply: (%s, %s, %s)", SPAWNS[i], position.x, position.y, position.z);
      // }

      return MESHES;
   };



   createArms() {
      let LEFT_ARM = new Cube(true);
      LEFT_ARM.scale(0.01, 0.01, 0.1);
      LEFT_ARM.applyAll();
      LEFT_ARM.move(-3, -5.2, -1.8);
      LEFT_ARM.COLOR = rgb(255, 255, 0, 1);

      let RIGHT_ARM = new Cube(true);
      RIGHT_ARM.scale(0.01, 0.01, 0.1);
      RIGHT_ARM.applyAll();
      RIGHT_ARM.move(3, -5.2, -1.8);
      RIGHT_ARM.COLOR = rgb(255, 255, 0, 1);
      return [LEFT_ARM, RIGHT_ARM];
   }


   persp(fieldOfViewInRadians, aspect, near, far) {
      let f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewInRadians);
      let rangeInv = 1.0 / (near - far);
      return new Matrix([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (near + far) * rangeInv, -1, 0, 0, near * far * rangeInv * 2, 0]);
   }
   dispose() {
      if (this._disposed) return;
      this._disposed = true;

      for (const id of this._intervalIds) clearInterval(id);
      this._intervalIds.length = 0;

      for (const u of this._unsubs) { try { u(); } catch { } }
      this._unsubs.length = 0;
   }
   async initialize() {
      this.webGlRenderer.vertexMap(['aPos', 3, 'aNor', 3, 'aUV', 2]);
      this.webGlRenderer.addTexture(2, this.prefix + '/final/textures/', 'm1garrand_v2.png');
      this.webGlRenderer.addTexture(4, this.prefix + '/final/textures/', 'zurg.png');
      this.webGlRenderer.addTexture(5, this.prefix + '/hw10/textures/', 'skin1.png');
      this.webGlRenderer.setUniform('1iv', 'uSampler', [0, 1, 2, 3, 4, 5]);
      this.webGlRenderer.setUniform('2fv', 'uOff', [this.XOFF, this.YOFF]);
      let ROOM = await this.makeRoom();
      ROOM.forEach(mesh => {
         this.MESHES.push(mesh);
      })

      const id = setInterval(() => {
         //if scene disposed don't render
         if (this._disposed) return;
         this.frame++;
         if (this.frame > this.frameLimit) {
            this.frame = 0;
         }
         const row = Math.floor(this.frame / 7);
         const col = this.frame % 7;
         this.XOFF = col * 0.25;
         this.YOFF = row * -.23;
         this.webGlRenderer.setUniform('2fv', 'uOff', [this.XOFF, this.YOFF]);
      }, 500);
      this._intervalIds.push(id);

      let P = this.persp(Math.PI / 4, this.canvas.width / this.canvas.height, 0.1, 200);
      this.webGlRenderer.setUniform('Matrix4fv', 'uMP', false, P.m);

      this.C = new Mesh();
      this.C.bake();
      this.ARMS.forEach(arm => {
         arm.setParent(this.C);
      });

      this.C.move(0, 0, 3);
      this.webGlRenderer.setUniform('Matrix4fv', 'uMV', false, this.C.QI.m);


      this.gameSession.eventBus.emit("scene:initialized", {
         loadDurgModel: this.loadDurgModel,
         loadZurgModel: this.loadZurgModel,
         loadM1Garrand: this.loadM1Garrand,
         loadThompson: this.loadThompson,
         loadRifle: this.loadRifle,

         camera: this.C,
         meshes: this.MESHES,
         scene: this
      });

      let hitUnsubscribe = this.gameSession.eventBus.on("game:hit", (event) => {
         //console.log('a target was hit');
         for (let i = this.MESHES.length - 1; i > -1; i--) {
            if (this.MESHES[i].name) {
               if (this.MESHES[i].name === event.name) {
                  //this.MESHES.splice(i,1);
                  //i=-1;
               }
            }
         }
      });
      this._unsubs.push(hitUnsubscribe);



      //this.testCube.name = "testCube";
      //this.testCube.move(0,0,-5);
      //this.testCube.scale(4,1,1);
      //this.testCube.COLOR = [0,1,0,0];
      //this.testCube.setParent(this.C);
      //this.MESHES.push(this.testCube);

      this.loadM1Garrand().then((mesh) => {
         this.MESHES.push(mesh);
         mesh.turnY(Math.PI / 180);
         mesh.setPosition(.3, 1.5, -1.8);
         mesh.setParent(this.C);


      }, (error) => { console.log(error) });
      /*this.loadThompson().then((mesh)=>{
         this.MESHES.push(mesh);
         
      },(error)=>{console.log(error)});
      this.loadRifle().then((mesh)=>{this.MESHES.push(mesh)},(error)=>{console.log(error)});*/
   }

   //boba: start
   async loadDurgModel() {
      const FILE = "durg.ply";
      const PATH = "/hw10/models/";

      let data = await Parser.importMesh(PATH, FILE, true);

      let M = new Mesh(data, false, false, 8, 5);

      // addTexture(4, this.prefix + '/hw10/textures/', 'skin1.png');


      M.move(0, 1, 0);


      //debug to outline bounding box
      //let boundingBox = new BoundingBoxMesh(M,[0,1,0,.1]);
      //this.MESHES.push(boundingBox);
      //end debug 

      return M;
   }
   async loadZurgModel() {
      const FILE = "zurg.ply";
      const PATH = "/final/models/";

      let data = await Parser.importMesh(PATH, FILE, true);

      let M = new Mesh(data, false, false, 8, 4);

      // addTexture(4, this.prefix + '/final/textures/', 'zurg.png');


      M.move(3, 1, 0);


      //debug to outline bounding box
      //let boundingBox = new BoundingBoxMesh(M,[0,1,0,.1]);
      // this.MESHES.push(boundingBox);
      //end debug 

      return M;
   }
   async loadM1Garrand() {
      const FILE = "gun.ply";
      const PATH = "/final/models/";

      let data = await Parser.importMesh(PATH, FILE, true);

      let M = new Mesh(data, false, false, 8, 2);

      M.move(3, 1, 0);


      //debug to outline bounding box
      //let boundingBox = new BoundingBoxMesh(M,[0,1,0,.1]);
      //this.MESHES.push(boundingBox);
      //end debug 

      return M;
   };
   async loadThompson() {
      const FILE = "ThompsonM1A1.ply";
      const PATH = "/final/models/";

      let data = await Parser.importMesh(PATH, FILE, true);

      let M = new Mesh(data, false, false, 8);

      M.move(4, 1, 0);



      //debug to outline bounding box
      //let boundingBox = new BoundingBoxMesh(M,[0,1,0,.1]);
      //this.MESHES.push(boundingBox);
      //end debug 

      return M;
   };
   async loadRifle() {
      const FILE = "HuntingRifle.ply";
      const PATH = "/final/models/";

      let data = await Parser.importMesh(PATH, FILE, true);

      let M = new Mesh(data, false, false, 8);

      M.move(5, 1, 0);


      //debug to outline bounding box
      //let boundingBox = new BoundingBoxMesh(M,[0,1,0,.1]);
      //this.MESHES.push(boundingBox);
      //end debug 

      return M;
   };

   getDirectionalVectors(matrix) {
      let forward = {
         x: -matrix[8],
         y: -matrix[9],
         z: -matrix[10]
      };
      let right = {
         x: matrix[0],
         y: matrix[1],
         z: matrix[2]
      };

      let up = {
         x: matrix[4],
         y: matrix[5],
         z: matrix[6]
      };
      return {
         forward: forward,
         right: right,
         up: up
      };
   }
   lerpVec3(a, b, t) {
      return {
         x: a.x + (b.x - a.x) * t,
         y: a.y + (b.y - a.y) * t,
         z: a.z + (b.z - a.z) * t
      };
   }
   //boba: end




   update() {
      if (this.gameSession !== undefined) {
         this.gameSession.update();
      }
      let time = Date.now() / 1000;
      this.updateMovement(time);;
      this.webGlRenderer.setUniform('1f', 'uTime', time - this.startTime);
      this.reloadShapes();
      this.previousTime = time;

   }



   updateCam() {
      this.webGlRenderer.setUniform('Matrix4fv', 'uMV', false, this.C.QI.m);
   }

   setCameraPosition(x, y, z) {
      // Clamp values
      x = Math.max(-X_MAX, Math.min(X_MAX, x));
      y = Math.max(2, Math.min(20, y));
      z = Math.max(-Z_MAX, Math.min(Z_MAX, z));

      // Apply to camera
      this.C.setPosition(x, y, z);

      // Force camera update
      this.updateCam();
   }

   updateMovement(time) {
      if (this.C) {
         let delta = time - this.previousTime;
         const V = { x: 4, y: 4, z: 4 };
         let x = 0;
         let y = 0;
         let z = 0;

         if (this.LEFT) {
            x += -V.x;
         }
         if (this.RIGHT) {
            x += V.x;
         }


         if (this.UP) {
            y += V.y;
         }
         if (this.DOWN) {
            y += -V.y;
         }
         y *= delta;
         x *= delta;

         if (x != 0 && y != 0) {
            y /= 2;
            x /= 2;
         }
         if (this.RISE === 'DOWN') {
            z += -V.z;
         }
         if (this.RISE === 'UP') {
            z += V.z;
         }

         this.C.move(x * this.C.Q.m[0] + -this.C.Q.m[8] * y, z * delta, -y * this.C.Q.m[10] + x * this.C.Q.m[2]);
         const POS = this.C.getPosition();
         POS.x = Math.max(-X_MAX, Math.min(X_MAX, POS.x));
         POS.z = Math.max(-Z_MAX, Math.min(Z_MAX, POS.z));
         POS.y = Math.max(2, Math.min(20, POS.y));
         this.C.setPosition(POS.x, POS.y, POS.z);
         this.updateCam();
      }
   }



   reloadShapes(){
      const N = this.MESHES.length;
      for (let i = 0; i < N; i++) {
         let mesh = this.MESHES[i];
         if (!mesh.render) {
            continue;
         }
         
         if (mesh.animate) {
            mesh.animate(Date.now() / 1000);
         }
         let M = mesh.getWorldMatrix();
         this.webGlRenderer.setUniform('Matrix4fv', 'uMF', false, M);
         this.webGlRenderer.setUniform('Matrix4fv', 'uMI', false, webglMath.inverse(M));
         this.webGlRenderer.setUniform('4fv', 'uC', mesh.COLOR);
         if (mesh.textID != -1) {
            this.webGlRenderer.setUniform('1i', 'uID', mesh.textID);
         }
         this.webGlRenderer.drawMesh(mesh.mesh);
      }

      if (this.C) {
         const gl = this.webGlRenderer.gl;
         gl.disable(gl.DEPTH_TEST);

         const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
         this.webGlRenderer.setUniform('Matrix4fv', 'uMV', false, identity);

         // --- NEW: USE ORTHO INSTEAD OF IDENTITY ---
         // This maps 0,0 to center and handles aspect ratio stretching
         const aspect = this.canvas.width / this.canvas.height;
         const orthoP = [
            1 / aspect, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
         ];
         this.webGlRenderer.setUniform('Matrix4fv', 'uMP', false, orthoP);

         if (this.crosshairMesh) {
            let M = this.crosshairMesh.getWorldMatrix();
            this.webGlRenderer.setUniform('Matrix4fv', 'uMF', false, M);
            this.webGlRenderer.setUniform('4fv', 'uC', [1, 0, 0, 1]);
            this.webGlRenderer.drawMesh(this.crosshairMesh.mesh);
         }

         if (this.healthMesh) {
            // 1. Move it to the corner (Identity space: -1 to 1)
            // Note: aspect correction for X makes it stay in the far left
            this.healthMesh.setPosition(-0.9 * aspect, 0.8, 0);

            // 2. Standard Matrix and Uniform setup
            let M = this.healthMesh.getWorldMatrix();
            this.webGlRenderer.setUniform('Matrix4fv', 'uMF', false, M);
            this.webGlRenderer.setUniform('Matrix4fv', 'uMI', false, webglMath.inverse(M));
            this.webGlRenderer.setUniform('4fv', 'uC', [0, 1, 0, 1]); // Green

            // 3. Skip texture sampling
            this.webGlRenderer.setUniform('1i', 'uID', -1);

            // 4. Same draw call as crosshair
            this.webGlRenderer.drawMesh(this.healthMesh.mesh);
         }

         gl.enable(gl.DEPTH_TEST);

         // IMPORTANT: Reset the 3D Camera/Projection
         this.updateCam();
         let P = this.persp(Math.PI / 4, this.canvas.width / this.canvas.height, 0.1, 200);
         this.webGlRenderer.setUniform('Matrix4fv', 'uMP', false, P.m);
      }
   }

}