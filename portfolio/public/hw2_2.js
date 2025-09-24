class Rectangle {
   //Origin is the center, width and height the dimensions of the rectangle
   uOrigin;
   width;
   height;

   //ID used for setting the uniform variable
   ID;
   uMinX;
   uMaxX;
   uMinY;
   uMaxY;

   DROP = false;

   constructor(uOrigin, width, height, ID) {
      this.width = width;
      this.height = height;
      this.ID = ID;
      this.setOrigin(uOrigin.x, uOrigin.y, uOrigin.z);
   }

   update() {
      this.uMaxX = this.uOrigin.x + this.width / 2;
      this.uMinX = this.uOrigin.x - this.width / 2;
      this.uMaxY = this.uOrigin.y + this.height / 2;
      this.uMinY = this.uOrigin.y - this.height / 2;

      // setUniform('1f', 'uMaxX' + this.ID, this.uMaxX);
      // setUniform('1f', 'uMinX' + this.ID, this.uMinX);

      // setUniform('1f', 'uMaxY' + this.ID, this.uMaxY);
      // setUniform('1f', 'uMinY' + this.ID, this.uMinY);
   }

   setOrigin(xP, yP, zP = 0.0) {
      this.uOrigin = { x: xP, y: yP, z: zP };
      // setUniform('3f', 'uOrigin' + this.ID, this.uOrigin.x, this.uOrigin.y, this.uOrigin.z);
      console.log(this.uOrigin);
      this.update();
   }

   getPack() {
      return [this.uOrigin.x, this.uOrigin.y, this.uOrigin.z, this.width, this.height, 0.0];
   }

   /*Check if Sphere S intersects with this rectangle*/
   checkIntersection(S) {
      let X = Math.max(this.uMinX, Math.min(S.uO.x, this.uMaxX));
      let Y = Math.max(this.uMinY, Math.min(S.uO.y, this.uMaxY));
      let dX = X - S.uO.x;
      let dY = Y - S.uO.y;
      let dist = dX ** 2 + dY ** 2;
      return dist <= S.uR;
   }
}

class Sphere {
   uO;
   uR;
   uC;
   ID;
   constructor(center, radius, color, ID) {
      this.uO = center;
      this.uR = radius;
      this.uC = color;
      this.ID = ID;

      console.log("Circle %d", ID);
   }

   setOrigin(xP, yP, zP = 0.0) {
      this.uO = { x: xP, y: yP, z: zP };
      // setUniform('4fv', 'uS' + this.ID, xP, yP, zP, this.uR);
   }

   update() {

   }

   getPack() {
      return [this.uO.x, this.uO.y, this.uO.z, this.uR];
   }

   getColor() {
      return [this.uC.r, this.uC.g, this.uC.b, this.uC.a];
   }

   /*Check if two spheres intersect by finding if the distance between their centers is less than the sum of their radii*/
   checkIntersection(S) {
      const d = Math.sqrt((S.uO.x - this.uO.x) ** 2 + (S.uO.y - this.uO.y) ** 2 + (S.uO.z - this.uO.z) ** 2);
      return d < (S.uR + this.uR);
   }

   setColor(C) {
      this.uC = C;
   }
}


function Scene(path = null) {


   if (path != null) {
      this.audio = new Audio(path);
      this.audio.loop = false;
   }

   this.uTime = Date.now() / 1000;
   this.uV = { x: 0.0, y: 0.0, z: 0.0 };

   //Recommended bounce angle and ball speed from ping pong math equation
   this.MAX_ANGLE = 5 * Math.PI / 12;
   this.SPEED = 1.0;

   let NSW = 11 * 2;
   let NSP = 30;
   this.BALL = NSW + NSP;
   let R = Math.sqrt(0.01);
   this.SPHERES = Array(NSW + 4);

   this.COLOR = 0;

   // this.COLORS = [{ r: 0.8, g: 0.6, b: 1.0, a: 0.6 }, { r: 1.0, g: 0.4, b: 0.4, a: 0.6 }, { r: 0.4, g: 1.0, b: 0.4, a: 0.6 }];
   this.COLORS = [rgb(0, 62, 106, 0.8), rgb(0, 126, 167, 0.8), rgb(95, 221, 229, 0.8)];

   let rem = 2; //Length (1-(-1))/R;
   for (let i = 0; i < NSW; i += 2) {
      this.SPHERES[i] = new Sphere({ x: -1 + R, y: -1 + (R * i), z: 0.0 }, R, this.COLORS[this.COLOR], i);
      this.SPHERES[i + 1] = new Sphere({ x: 1 - R, y: -1 + (R * i), z: 0.0 }, R, this.COLORS[this.COLOR], i + 1);
   }
   this.RECTANGLES = [new Rectangle({ x: -1 + R, y: 0.0, z: 0.0 }, 2 * R, 2.0, 0.0), new Rectangle({ x: 1 - R, y: 0.0, z: 0.0 }, 2 * R, 2.0, 0.0)];


   rem -= R * 4;
   let row = 6;
   let col = 5;
   let padding = rem / (col + 1);
   let padding2 = rem / (col + 1 + 2);
   let r = 0.04;

   for (let j = 0; j < row; j++) {
      for (let i = 0; i < col; i++) {
         // this.SPHERES[NSW + (j * col) + i] = new Sphere({ x: -1 + 2 * R + padding * (i + 1), y: -1 + r + (j * r * 8), z: 0.0 }, r, { r: 1.0, g: 1.0, b: 1.0, a: 0.0 }, NSW + (j * col) + i);
         this.SPHERES[NSW + (j * col) + i] = new Sphere({ x: -1 + 2 * R + padding * (i + 1), y: -1 + r + (j * r * 8), z: 0.0 }, r, rgb(255, 140, 148, 0), NSW + (j * col) + i);
      }
   }

   let rB = 1.75 * r;
   this.SPHERES[NSW + NSP] = new Sphere({ x: 0, y: 1 - 2 * rB, z: 0.0 }, rB, { r: 0.0, g: 1.0, b: 1.0, a: 0.0 }, this.BALL);

   this.vertexShader = `#version 300 es
   in  vec3 aPos;
   out vec3 vPos;
   void main() {
   gl_Position = vec4(aPos, 1.);
   vPos = aPos;
}`;

   this.fragmentShader = `#version 300 es
   precision highp float;
   uniform float uTime;

   in  vec3 vPos;
   out vec4 fragColor;

   uniform vec3 uR[`+ this.RECTANGLES.length * 2 + `];
   uniform vec4 uS[`+ this.SPHERES.length + `];
   uniform vec4 uSC[`+ this.SPHERES.length + `];

   vec2 raySphere(vec3 V, vec3 W, vec4 S){
      V -= S.xyz;
      float b = dot(V, W);
      float d = b * b - dot(V, V) + S.w * S.w;
      if (d < 0.){
         return vec2(1001., 1000.);
      }
      return vec2(-b - sqrt(d), -b + sqrt(d));
   }
   bool inShadow(vec3 P, vec3 L){
      for (int i = 0 ; i < `+ this.SPHERES.length + ` ; i++) {
         vec2 tt = raySphere(P, L, uS[i]);
         if (tt.x < tt.y && tt.x > 0.)
            return true;
      }
      return false;
   }
   
   vec3 shadeSphere(vec4 S, vec3 P, vec3 C){
      vec3 N = (P - S.xyz) / S.w;

      vec3 shade = vec3(.1);
      if (!inShadow(P, normalize(vec3(0.0,0.0,1.0)))){
         shade += vec3(1.0) * max(0., dot(N, normalize(vec3(0.0, 0.0, 1.0))));
      }

      

      return C * shade;
   }

   void main() {
      vec4 F = vec4(0.42, 0.29, 0.03, 1.);
      vec3 V = vec3 (0.,0.,5.);
      vec3 W = normalize(vPos-V);
      float t = 100.;
      // fragColor = vec4(0.42, 0.29, 0.03, 1.);
      fragColor = vec4(0.0, (1.0+sin(vPos.y/2.0))/2.0, 1.0, 1.0);
         
   //First, we define the bounding rectangles
   //Border 1: (-1, 1, 0), (-0.75, 1, 0), (-1, -1, 0), (-0.75, -1, 0);
      for(int i = 0; i < `+ this.RECTANGLES.length * 2 + `; i+=2){
         vec3 R = uR[i];
         vec3 BOUNDS = uR[i+1]/2.0;
         if (R.x - BOUNDS.x <= vPos.x && vPos.x <= R.x + BOUNDS.x && R.y - BOUNDS.y <= vPos.y && vPos.y <= R.y + BOUNDS.y){
            // fragColor = vec4(139./255., 69./255., 19./255.,1.);
         }
      }

   //Now we define our spheres
      for(int i = 0; i < `+ this.SPHERES.length + `; i++){
         vec2 tt = raySphere(V, W, uS[i]);
         if (tt.x < tt.y && tt.x > 0. && tt.x < t){
            t = tt.x;
            vec3 P = V + t * W;
            vec3 a = shadeSphere(uS[i], P, uSC[i].xyz);
            a += uSC[i].a * uSC[i].xyz;
            F = vec4(a, 1.0);
            fragColor = vec4(sqrt(F.rgb), F.a);
         }
      }
}`;

   this.events = [['mousemove', (evt) => {
      if (!this.DROP) {
         const canvas = evt.currentTarget;          // the canvas element
         const rect = canvas.getBoundingClientRect();
         const px = (evt.clientX - rect.left) / rect.width; // [0,1]
         let x = -1 + px * 2;                                // [-1,1]
         x = Math.max(-1 + 2 * R + rB, Math.min(1 - 2 * R - rB, x));

         const s = this.SPHERES[this.BALL];
         s.setOrigin(x, s.uO.y, s.uO.z);
         let S = Array(this.SPHERES.length);
         for (let i = 0; i < this.SPHERES.length; i++) {
            S[i] = this.SPHERES[i].getPack();
         }
         setUniform('4fv', 'uS', S.flat());
      }
   }], ['click', (evt) => {
      this.DROP = true;
      this.uTime = Date.now() / 1000;
   }], ['keydown', (evt) => {
      if (evt.key === 'r') {
         this.reset();
      }
   }]]

   this.initialize = (all = true) => {
      let R = Array(this.RECTANGLES.length);
      for (let i = 0; i < this.RECTANGLES.length; i++) {
         R[i] = this.RECTANGLES[i].getPack();
      }
      setUniform('3fv', 'uR', R.flat());

      let S = Array(this.SPHERES.length);
      let C = Array(this.SPHERES.length);
      for (let i = 0; i < this.SPHERES.length; i++) {
         S[i] = this.SPHERES[i].getPack();
         C[i] = this.SPHERES[i].getColor();
      }
      setUniform('4fv', 'uS', S.flat());
      setUniform('4fv', 'uSC', C.flat());

      setInterval(() => {
         if (!this.DROP) {
            this.COLOR++;
         }
      }, 1000);

   }

   function rgb(r, g, b, a) {
      return { r: r / 255, g: g / 255, b: b / 255, a: a };
   }

   function normalize(V) {
      let length = Math.sqrt(V.x ** 2 + V.y ** 2 + V.z ** 2);
      if (length == 0) {
         return V;
      }
      return { x: V.x / length, y: V.y / length, z: V.z / length };
   }

   function dot(V, N) {
      return V.x * N.x + V.y * N.y + V.z * N.z;
   }

   function magnitude(V) {
      return Math.sqrt(dot(V, V));
   }

   this.switchLights = (idx) => {
      return this.COLORS[(this.COLOR + idx) % this.COLORS.length];
   }

   this.reset = () => {
      this.DROP = false;
      // this.COLOR = 0;
      const s = this.SPHERES[this.BALL];
      s.setOrigin(0.0, 1.0 - 2 * rB, s.uO.z);
      this.uV = { x: 0.0, y: 0.0, z: 0.0 };
      let S = Array(this.SPHERES.length);
      for (let i = 0; i < this.SPHERES.length; i++) {
         S[i] = this.SPHERES[i].getPack();
      }
      setUniform('4fv', 'uS', S.flat());
   }

   this.update = () => {
      const new_time = (Date.now() / 1000);
      const delta = new_time - this.uTime;
      let C = Array(this.SPHERES.length);
      if (this.DROP) {
         const e = 0.98;

         //Check for rectangle intersections
         const s = this.SPHERES[this.BALL];

         //Calculate the change by gravity

         let a = -9.8 * delta / 2;
         this.uV.y += a;
         let y = s.uO.y + this.uV.y * delta;
         let x = s.uO.x + this.uV.x * delta;

         x = Math.max(Math.min(x, 1 - 2 * rB), -1 + 2 * rB);

         if (y <= -1 - 2 * rB) {
            // s.setOrigin(0.0, 1.0 - 2 * rB, s.uO.z);
            // this.DROP = false;
            // this.uV = { x: 0.0, y: 0.0, z: 0.0 };
            this.reset();
         } else {
            s.setOrigin(x, y, s.uO.z);
         }

         for (let i = 0; i < this.RECTANGLES.length; i++) {
            const R = this.RECTANGLES[i];
            if (R.checkIntersection[s]) {
               console.log("Hit Wall");
               this.uV.x *= -e;
            }
         }
         let S = Array(this.SPHERES.length);
         // let C = Array(this.SPHERES.length);
         let P;
         for (let i = 0; i < this.SPHERES.length - 1; i++) {
            P = this.SPHERES[i];
            if (P.checkIntersection(s)) {
               let normal = { x: s.uO.x - P.uO.x, y: s.uO.y - P.uO.y, z: s.uO.z - P.uO.z };
               let mag = magnitude(normal);
               let dist = s.uR + P.uR - mag;
               normal = normalize(normal);

               //Push out from ball
               s.setOrigin(s.uO.x + normal.x * dist, s.uO.y + normal.y * dist, 0.0);

               let dv = -(1 + e) * dot(this.uV, normal);
               dv = { x: dv * normal.x, y: dv * normal.y, z: dv * normal.z }
               this.uV.x += dv.x;
               this.uV.y += dv.y;
               this.uV.z += dv.z;
               if (this.audio) {
                  const a = this.audio.cloneNode(true);
                  a.volume = dist / (s.uR + P.uR);
                  a.play();
                  a.loop = false;
               }
               if (NSW <= i && i < NSW + NSP) {
                  P.uC.a = 0.8;
                  setTimeout(() => { this.SPHERES[i].uC.a = 0.0; }, 200);
               }
            }
            if (i < NSW) {
               const CC = this.switchLights(Math.floor(i / 2));
               P.uC = { r: CC.r, g: CC.g, b: CC.b, a: 0.4 + 0.6 * (1 + Math.sin(new_time * 4)) / 2 };
            }
            S[i] = P.getPack();
            console.log();
         }
         S[this.BALL] = s.getPack();
         setUniform('4fv', 'uS', S.flat());
         this.uTime = new_time;
      }
      for (let i = 0; i < this.SPHERES.length; i++) {
         const P = this.SPHERES[i];
         if (i < NSW) {
            if (!this.DROP) {
               P.uC = this.switchLights(Math.floor(i / 2));
            }
         }
         C[i] = P.getColor();
      }
      setUniform('4fv', 'uSC', C.flat());
   }

}
console.log("HW 2 Scene loaded");