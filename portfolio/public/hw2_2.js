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

   checkIntersection() {

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
}


function Scene() {


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
   let rem = 2; //Length (1-(-1))/R;
   for (let i = 0; i < NSW; i += 2) {
      this.SPHERES[i] = new Sphere({ x: -1 + R, y: -1 + (R * i), z: 0.0 }, R, { r: 1.0, g: 1.0, b: 0.6, a: 0.8 }, i);
      this.SPHERES[i + 1] = new Sphere({ x: 1 - R, y: -1 + (R * i), z: 0.0 }, R, { r: 1.0, g: 1.0, b: 0.6, a: 0.8 }, i + 1);
   }
   this.RECTANGLES = [new Rectangle({ x: -1 + R, y: 0.0, z: 0.0 }, 2 * R, 2.0, 0.0), new Rectangle({ x: -1 + R, y: 0.0, z: 0.0 }, 2 * R, 2.0, 0.0), new Rectangle({ x: 1 - R, y: 0.0, z: 0.0 }, 2 * R, 2.0, 0.0), new Rectangle({ x: 1 - R, y: 0.0, z: 0.0 }, 2 * R, 2.0, 0.0)];


   // rem -= R * 2;
   // let r = 0.05;
   // let row = 5;
   // let col = 10;

   // let padding = rem - (2*col *r);
   // padding /= col + 1;


   // for(let i = 0; i <= col; i++){
   //    this.SPHERES[NSW + i] = new Sphere({x: -1 + R + (padding + r)*(i), y:-1, z:0.0}, r, {r: 0.3, g: 0.0, b: 0.3, a:1.0}, NSW+i);
   // }

   rem -= R * 4;
   let row = 6;
   let col = 5;
   let padding = rem / (col + 1);
   let padding2 = rem / (col + 1 + 2);
   let r = 0.04;

   for (let j = 0; j < row; j++) {
      for (let i = 0; i < col; i++) {
         this.SPHERES[NSW + (j * col) + i] = new Sphere({ x: -1 + 2 * R + padding * (i + 1), y: -1 + r + (j * r * 8), z: 0.0 }, r, { r: 1.0, g: 0.75, b: 0.23, a: 0.0 }, NSW + (j * col) + i);
      }
   }

   let rB = 1.75 * r;
   this.SPHERES[NSW + NSP] = new Sphere({ x: 0, y: 1 - 2 * rB, z: 0.0 }, rB, { r: 0.0, g: 1.0, b: 1.0, a: 0.0 }, this.BALL);

   // this.SPHERES[NSW] = new Sphere({x: -0.975 + padding+ (r), y:-1, z:0.0}, r, {r: 0.3, g: 0.0, b: 0.0, a:1.0}, NSW);
   // this.SPHERES[NSW+1] = new Sphere({x: -0.975 + (padding + r)*2, y:-1, z:0.0}, r, {r: 0.0, g: 0.3, b: 0.0, a:1.0}, NSW);

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
   
   vec3 shadeSphere(vec4 S, vec3 P, vec3 C){
      vec3 N = (P - S.xyz) / S.w;

      vec3 shade = vec3(.1);

      shade += vec3(1.0) * max(0., dot(N, normalize(vec3(0.0, 0.0, 1.0))));

      return C * shade;
   }

   void main() {
      vec4 F = vec4(0.42, 0.29, 0.03, 1.);
      vec3 V = vec3 (0.,0.,5.);
      vec3 W = normalize(vPos-V);
      float t = 100.;
      fragColor = vec4(0.42, 0.29, 0.03, 1.);
         
   //First, we define the bounding rectangles
   //Border 1: (-1, 1, 0), (-0.75, 1, 0), (-1, -1, 0), (-0.75, -1, 0);
      int count = 0;
      for(int i = 0; i < `+ this.RECTANGLES.length * 2 + `; i+=2){
         vec3 R = uR[i];
         vec3 BOUNDS = uR[i+1]/2.0;
         if (R.x - BOUNDS.x <= vPos.x && vPos.x <= R.x + BOUNDS.x && R.y - BOUNDS.y <= vPos.y && vPos.y <= R.y + BOUNDS.y){
            if(count % 2 == 1){
               fragColor = vec4(0.5, 0., 1., 1.);   
            }else{
               // fragColor = vec4(.3, 0., 1., 1.);
            fragColor = vec4(139./255., 69./255., 19./255.,1.);
            }
         }
         // count++;
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
         // vec4 S = uS[i];
         // vec3 p = vPos - S.xyz;
         // p = vec3(p.xy, sqrt(S.w * S.w - dot(p, p)));
         // if (p.z > 0.){
         //    float d = 0.5 * max(0., dot(p, vec3(0.0,1.0, 0.0)));
         //    fragColor = uSC[i] * (vec4(vec3(d), 1.) + 3.5*vec4(0.2, 0.1, 0.05, 2.0));
         // }
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

   }

   //Our update loop changes the direction of the circle
   //Our rectangle is moved by the 'keydown' event in this.events

   //Math for updating the circle direction after intersecting the square
   //taken from: https://gamedev.stackexchange.com/questions/4253/in-pong-how-do-you-calculate-the-balls-direction-when-it-bounces-off-the-paddle
   //Theirs is for a vertical paddle, so I flipped the y and x in my solution
   this.update = () => {
      if (this.DROP) {
         const new_time = (Date.now() / 1000);
         const delta = new_time - this.uTime;

         const s = this.SPHERES[this.BALL];
         let a = -9.8 * delta;
         this.uV.y += a;
         let y = s.uO.y + this.uV.y * delta;

         if (y <= -1 - 2 * rB) {
            s.setOrigin(0.0, 1.0 - 2 * rB, s.uO.z);
            this.DROP = false;
            this.uV.y = 0;
         } else {
            s.setOrigin(s.uO.x, y, s.uO.z);
         }
         let S = Array(this.SPHERES.length);
         for (let i = 0; i < this.SPHERES.length; i++) {
            S[i] = this.SPHERES[i].getPack();
         }
         setUniform('4fv', 'uS', S.flat());

         this.uTime = new_time;
      }
   }

   //Equation to find whether or not they have any intersection taken from
   //Geeks for Geeks: Check if any point overlaps the given Circle and Rectangle
   //Diagonal Rectangle Points are: (MinX, MaxY), (MaxX, minY)
   //Note: my radius is already squared by default
   this.checkIntersection = () => {
      let X = Math.max(this.uMinX, Math.min(this.uOgCc.x, this.uMaxX));
      let Y = Math.max(this.uMinY, Math.min(this.uOgCc.y, this.uMaxY));
      let dX = X - this.uOgCc.x;
      let dY = Y - this.uOgCc.y;
      let dist = dX ** 2 + dY ** 2;
      return dist <= this.radius;
   }
}
console.log("HW 2 Scene loaded");