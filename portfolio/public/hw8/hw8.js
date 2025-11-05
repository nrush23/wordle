/**
 * @param {*} canvas 
 */

function Scene(canvas) {
   this.yaw = 0;
   this.pitch = 0;
   this.PREV_CX = null;
   this.PREV_CY = null;
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

   /*Given two 3D vectors, get their midpoint*/
   let midpoint = (a, b) => {
      let m = add(b, a);
      for (let i = 0; i < m.length; i++) {
         m[i] = m[i] / 2;
      }
      return m;
   }

   /* Creates a midpoint triangle based off of the parent triangle's a,b,d points*/
   let makeTriangle = (triangle) => {
      const a = triangle[0];
      const b = triangle[1];
      const c = triangle[2];

      const m1 = midpoint(a, b);
      const m2 = midpoint(b, c);
      const m3 = midpoint(c, a);
      return [m1, m2, m3, m1];
   }


   /* Adds all the sublevel triangles to the provided meshes array*/
   let subLevel = (N, triangles, T, make_mesh = true) => {
      if (N == 0) {
         return;
      }
      //First create our triangle
      const triangle = createPathsMesh(0.005, [T]);
      if (make_mesh) {
         triangles.push(new Mesh(triangle.data, triangle.triangle_strip));
      } else {
         triangles.push(...triangle.data);
      }

      //Get midpoints
      let M = makeTriangle(T);

      //Get subregion triangles
      let T1 = [T[1], M[0], M[1], T[1]];
      let T2 = [T[2], M[1], M[2], T[2]];
      let T3 = [T[0], M[0], M[2], T[0]];

      let TN = [T1, T2, T3];
      TN.forEach(TI => {
         subLevel(N - 1, triangles, TI, make_mesh);
      })
   }

   /*Create a single Sierpinski triangle mesh */
   let SIERPINSKI = (N, T) => {
      let points = [];
      subLevel(N, points, T, false);
      return new Mesh(new Float32Array(points.flat()), true);
   }

   this.LEFT = false;
   this.RIGHT = false;
   this.UP = false;
   this.DOWN = false;

   function rgb(r, g, b, a) {
      return [r / 255, g / 255, b / 255, a];
   }

   let CART = new Cube();
   CART.scale(0.025, 0.02, 0.3);
   CART.move(0, -0.04, -0.5);
   CART.COLOR = rgb(153, 76, 0, 1);

   function createWorld() {
      let background = new Cube();
      background.scale(50, 50, 50);
      background.COLOR = rgb(0, 0, 0, 1);
      return background;
   }


   this.canvas = canvas;

   this.meshes = [createWorld()];

   const MESH = SIERPINSKI(8, [[-1, -1, 1], [1, -1, 1], [0, 1, 1], [-1, -1, 1]]);
   MESH.move(0, 10.25, 0);
   MESH.scale(21, 15, 15);
   const MESH2 = MESH.duplicate();
   const MESH3 = MESH.duplicate();
   const MESH4 = MESH.duplicate();
   console.log(MESH);
   this.meshes.push(MESH);
   this.meshes.push(MESH2);
   this.meshes.push(MESH3);
   this.meshes.push(MESH4);

   MESH2.COLOR = MESH.COLOR;
   MESH3.COLOR = MESH.COLOR;
   MESH4.COLOR = MESH.COLOR;


   MESH.turnX(Math.PI / 4)
   MESH2.turnX(-Math.PI / 4);

   MESH3.turnX(Math.PI / 4);
   MESH3.turnY(Math.PI / 2);
   MESH4.turnX(-Math.PI / 4);
   MESH4.turnY(Math.PI / 2);

   MESH2.move(0, 0, -10.5);
   MESH.move(0, 0, 10.5);
   MESH3.move(-10.5, 0, 0);
   MESH4.move(10.5, 0, 0);


   function createGround() {
      let GROUND = new Cube();
      GROUND.scale(21, 0.2, 21);
      GROUND.move(0, -0.55, 1);
      GROUND.COLOR = rgb(255, 0, 255, 1);
      return GROUND;
   }

   function createArms() {
      let LEFT_ARM = new Cube();
      LEFT_ARM.scale(0.01, 0.01, 0.1);
      LEFT_ARM.applyAll();
      LEFT_ARM.move(-3, -5.2, -1.8);
      LEFT_ARM.COLOR = rgb(200, 0, 0, 1);

      let RIGHT_ARM = new Cube();
      RIGHT_ARM.scale(0.01, 0.01, 0.1);
      RIGHT_ARM.applyAll();
      RIGHT_ARM.move(3, -5.2, -1.8);
      RIGHT_ARM.COLOR = rgb(255, 0, 0, 1);
      return [LEFT_ARM, RIGHT_ARM];
   }


   this.GROUND = createGround();
   this.meshes = this.meshes.concat(this.GROUND);
   const ARMS = createArms();
   this.meshes = this.meshes.concat(ARMS);

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

vec4 cubeTexture(vec3 P, vec4 C){
   float a = .5;
   float b = .52;
   float s = 0.;
   float r0 = length(P.xy);
   float t = mod(uTime, 1.);
      
   float u0 = turbulence(vec3(P.x*(2.-t)/2., P.y*(2.-t)/2., .2* t    +2.));
      
   float u1 = turbulence(vec3(P.x*(2.-t)   , P.y*(2.-t)   , .2*(t-1.)+2.));
      
   float r = min(1., r0 - .1 + 0.3 * mix(u0, u1, t));
      
   s = (1. - r) / (1. - b);
      
   t = max(0.,min(1., (r0 - a) / (b - a)));

   r = .9 + .1 * noise(13.*P+vec3(0.,0.,uTime));
   vec4 f0 = vec4(2.*r,r,(r*r+r)/2.,1.);

   vec3 color = vec3(s);
   float ss = s * s;
   color = ss*vec3(1.0,ss*ss,ss*ss*ss);
   vec4 f1 = vec4(color, ss) * C;

   return f1 * C;
}

vec3 wood(vec3 P, vec3 C){
   P.y += .5 * turbulence(P);
   vec3 c = C *
            mix(2.5, .1,
	        .5 + .25 * turbulence(vec3(.5,40.,40.) * P+2.*sin(P))
                   + .25 * turbulence(vec3(40.,40.,.5) * P+2.*sin(P)));
   c *= .3 + .7 * pow(abs(sin(10. * P.y)), .2);
   return c;
}

vec3 cubeTexture2(vec3 P, vec4 C){
   float v = turbulence(1.5 * P * uTime);
   float s = sqrt(.5 + .5 * cos(1. * P.x + 8. * v));
   // return vec3(.8,0.0,.0) * vec3(s,s*s,s*s*s);
   float b = mix(0.8, 1.0, s);
   return mix(vec3(0.3,0.0,0.0), C.rgb, b);
}

vec3 marble(vec3 P) {
   float v = turbulence(1.5 * P);
   float s = sqrt(1.0 + 1.0 * sin(20. * P.x + 8. * v *uTime));
   return vec3(1.0,1.0,1.0) * vec3(s,s*s,s*s*s);
}

vec3 ground(vec3 P){
   P = P + vec3(sin(uTime), noise(P), cos(uTime));
   float v = turbulence(1.5 * P);
   float s = sqrt(1.0 + cos(1. * P.x + 8. * v * noise(P)*uTime));
   return vec3(1.0,1.,1.0) * vec3(s,s*s,s*s*s);
}

void main() {
   //First color the background
   float t = 0.02 * vPos.y;
   if (t > .5)
      t -= .3 * turbulence(vPos + vec3(uTime,0.,.1*uTime));
   vec3 c = vec3(0.,0.,0.);
   c = mix(c, vec3(0.1,0.,0.0), min(t,.5));
   if (t > 0.65)
      c = mix(c, vec3(.2,0.,0.0), (t-.65) / (.7 - .65));
   fragColor = vec4(sqrt(c), 1.);
   if (!uClouds){
      vec3 nor = normalize(vNor);
      vec3 L = vec3(2.0,1.0,2.0);
      float c_s = .5 + max(0., dot(normalize(L),nor));
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
      let P = persp(Math.PI / 4, this.canvas.width / this.canvas.height, 0.1, 100);
      setUniform('Matrix4fv', 'uMP', false, P.m);

      this.C = new Mesh();
      this.C.bake();
      ARMS.forEach(arm => {
         arm.setParent(this.C);
      });
      // this.CENTER.setParent(this.C);
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
   }], ['click', (evt) => {

   }]];

   this.update = () => {
      let time = Date.now() / 1000;
      this.updateMovement(time);
      COLOR = rgb(127.5 * Math.sin(time) + 127.5, 0, 0);
      MESH.COLOR = COLOR;
      MESH2.COLOR = COLOR;
      MESH3.COLOR = COLOR;
      MESH4.COLOR = COLOR;
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
         setUniform('1i', 'uClouds', (i == 0) ? 1 : 0);
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