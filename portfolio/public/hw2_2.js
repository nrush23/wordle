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

   constructor(uOrigin, width, height, ID){
      this.width = width;
      this.height = height;
      this.ID = ID;
      this.setOrigin(uOrigin.x, uOrigin.y, uOrigin.z);
   }

   update(){
      this.uMaxX = this.uOrigin.x + this.width/2;
      this.uMinX = this.uOrigin.x - this.width/2;
      this.uMaxY = this.uOrigin.y + this.height/2;
      this.uMinY = this.uOrigin.y - this.height/2;

      // setUniform('1f', 'uMaxX' + this.ID, this.uMaxX);
      // setUniform('1f', 'uMinX' + this.ID, this.uMinX);

      // setUniform('1f', 'uMaxY' + this.ID, this.uMaxY);
      // setUniform('1f', 'uMinY' + this.ID, this.uMinY);
   }

   setOrigin(xP, yP, zP=0.0){
      this.uOrigin = {x: xP, y: yP, z: zP};
      // setUniform('3f', 'uOrigin' + this.ID, this.uOrigin.x, this.uOrigin.y, this.uOrigin.z);
      console.log(this.uOrigin);
      this.update();
   }

   getPack(){
      return [this.uOrigin.x, this.uOrigin.y, this.uOrigin.z, this.width, this.height, 0.0];
   }

   checkIntersection(){

   }
}

function Scene() {

   this.uOgSq = { x: 0.0, y: -1 + 0.05, z: 0.0 };
   this.uOgCc = { x: 0.0, y: 1, z: 0.0 };
   this.uVel = { x: 0.0, y: -1.0, z: 0.0 };
   this.radius = 0.005;
   this.height = 0.1 / 2.0;
   this.width = this.height * 4.0;

   this.uMinX = Math.max(-1.0, this.uOgSq.x - this.width);
   this.uMaxX = Math.min(1.0, this.uOgSq.x + this.width);
   this.uMinY = Math.max(-1.0, this.uOgSq.y - this.height);
   this.uMaxY = Math.min(1.0, this.uOgSq.y + this.height);

   this.uTime = Date.now() / 1000;

   this.uGrad = -0.3;

   this.uSparkle = false;
   this.uSpx = 0.0;

   //Recommended bounce angle and ball speed from ping pong math equation
   this.MAX_ANGLE = 5 * Math.PI / 12;
   this.SPEED = 1.0;

   this.RECTANGLES = [new Rectangle({x: -0.875, y: 0.0, z: 0.0}, 0.25, 2.0, 0.0), new Rectangle({x: -0.875, y: 0.0, z: 0.0}, 0.1, 2.0, 0.0),new Rectangle({x: 0.875, y: 0.0, z: 0.0}, 0.25, 2.0, 0.0), new Rectangle({x: 0.875, y: 0.0, z: 0.0}, 0.1, 2.0, 0.0)];


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
   uniform vec3 uOgSq;
   uniform vec3 uOgCc;

   uniform float uMinX;
   uniform float uMaxX;
   uniform float uMinY;
   uniform float uMaxY;
   uniform float uGrad;

   uniform bool uSparkle;
   uniform float uSpx;

   in  vec3 vPos;
   out vec4 fragColor;

   uniform vec3 uR[`+this.RECTANGLES.length * 2+`];

   void main() {
      fragColor = vec4(0., 0.5, 1., 1.);
         
   //First, we define the bounding rectangles
   //Border 1: (-1, 1, 0), (-0.75, 1, 0), (-1, -1, 0), (-0.75, -1, 0);
      int count = 0;
      for(int i = 0; i < `+this.RECTANGLES.length * 2+`; i+=2){
         vec3 R = uR[i];
         vec3 BOUNDS = uR[i+1]/2.0;
         if (R.x - BOUNDS.x <= vPos.x && vPos.x <= R.x + BOUNDS.x && R.y - BOUNDS.y <= vPos.y && vPos.y <= R.y + BOUNDS.y){
            if(count % 2 == 1){
               fragColor = vec4(0.5, 0., 1., 1.);   
            }else{
               fragColor = vec4(.3, 0., 1., 1.);
            }
         }
         count++;
      }



   // float radius = 0.005;
   // vec3 origin = vPos - uOgCc;
   // fragColor = vec4(0.);
   // vec3 p = vec3(vPos.xy, sqrt(radius - dot(origin, origin)));
   // bool inC = p.z > 0.0;
   // float height = 0.1/2.0;
   // float width = height * 4.0;
   // float pi = 3.141592653589793;

   // bool inS = uMinX <= vPos.x && vPos.x <= uMaxX && uMinY <= vPos.y && vPos.y <= uMaxY;

   // if(inC){
   //    float myZ = 1.0 - p.z;
   //    fragColor = vec4(myZ * 0.5, 0.0, myZ, 1.0);
   //    float d = 0.5 * max(0.0, dot(p, vec3(1.0)));
   //    fragColor += vec4(vec3(d), 1.0);
   // }else if (inS){
   //    fragColor = vec4(0.5 -0.5 * vPos, 1.);
   // }else{
   //    fragColor = vec4((sin(uGrad) + 1.0)/7.5, 0.0, (sin(vPos.x + uGrad) + 1.0)/2.0, 1.0);
   // }

   // //Make 10 sparkles rotating around the circle that extend outwards
   // if (uSparkle){
   //    for(int i = 0; i < 10; i++){
   //       float angle = 2.0*pi * (float(i) / 10.0);
   //       float ogY = sin(uSpx/pi);
   //       float xSp = (uSpx * cos(angle)) - (ogY * sin(angle));
   //       float ySp = (uSpx * sin(angle)) + (ogY * cos(angle));
   //       vec3 spOg = vPos - vec3(xSp, ySp, 0.0);
   //       spOg -= uOgCc;
   //       vec3 sp = vec3(vPos.xy, sqrt(0.0001 - dot(spOg, spOg)));
   //       if (sp.z > 0.0){
   //          fragColor = vec4(1.0, 1.0, 1.0, 1.0);
   //       }
   //    }
   // }
}`;

   this.events = [['keydown', (evt) => {

      const delta = 0.06;
      let x = 0;

      //If moving left or right, move by delta
      if (evt.key === 'ArrowLeft' || evt.key === 'a') {
         x = -delta;
      } else if (evt.key === 'ArrowRight' || evt.key === 'd') {
         x = delta;
      }
      //Update the center of the square
      if (-1 <= this.uOgSq.x + x && this.uOgSq.x + x <= 1) {
         this.uOgSq.x += x;
      }

      //Update the boundaries of the square
      this.uMinX = Math.max(-1.0, this.uOgSq.x - this.width);
      this.uMaxX = Math.min(1.0, this.uOgSq.x + this.width);
      this.uMinY = Math.max(-1.0, this.uOgSq.y - this.height);
      this.uMaxY = Math.min(1.0, this.uOgSq.y + this.height);

      //Now update the square uniforms
      this.initialize(false);

      // console.log(evt.key);

   }]];

   this.initialize = (all = true) => {
      let R = Array(this.RECTANGLES.length);
      for(let i = 0; i < this.RECTANGLES.length; i++){
         R[i] = this.RECTANGLES[i].getPack();
      }
      setUniform('3fv', 'uR', R.flat());

      if (all) {
         setUniform('3f', 'uOgCc', this.uOgCc.x, this.uOgCc.y, this.uOgCc.z);
         setUniform('1f', 'uGrad', this.uGrad);
         setUniform('1i', 'uSparkle', 0);
         setUniform('1f', 'uSpx', 0.0);
      }
      setUniform('3f', 'uOgSq', this.uOgSq.x, this.uOgSq.y, this.uOgSq.z);
      setUniform('1f', 'uMinX', this.uMinX);
      setUniform('1f', 'uMaxX', this.uMaxX);
      setUniform('1f', 'uMinY', this.uMinY);
      setUniform('1f', 'uMaxY', this.uMaxY);


   }

   //Our update loop changes the direction of the circle
   //Our rectangle is moved by the 'keydown' event in this.events

   //Math for updating the circle direction after intersecting the square
   //taken from: https://gamedev.stackexchange.com/questions/4253/in-pong-how-do-you-calculate-the-balls-direction-when-it-bounces-off-the-paddle
   //Theirs is for a vertical paddle, so I flipped the y and x in my solution
   this.update = () => {
      const new_time = (Date.now() / 1000);
      const delta = new_time - this.uTime;

      //If the square and the circle intersect, we have to change direction
      if (this.checkIntersection()) {
         let intersectX = Math.max(this.uMinX, Math.min(this.uOgCc.x, this.uMaxX));
         let normal = (intersectX - this.uOgSq.x) / this.width;

         let angle = normal * this.MAX_ANGLE;

         //Flip y and x because we are a horizontal square
         this.uVel.y = this.SPEED * Math.cos(angle);
         this.uVel.x = this.SPEED * -Math.sin(angle);
         this.uSparkle = true;
         this.uSpx = 0.0;
         setUniform('1i', 'uSparkle', 1);
         setUniform('1f', 'uSpx', this.uSpx);
         setTimeout(() => { this.uSparkle = false; this.uSpx = 0.0; setUniform('1i', 'uSparkle', 0); setUniform('1f', 'uSpx', 0.0); }, 1000)
      }
      this.uOgCc.x += this.uVel.x * delta;
      this.uOgCc.y += this.uVel.y * delta;

      if (this.uSparkle) {
         this.uSpx += 1.0 * delta;
         setUniform('1f', 'uSpx', this.uSpx);
      }

      //Otherwise, check if we hit a boundary and reverse direction
      if (this.uOgCc.x > 1.0 - Math.sqrt(this.radius) || this.uOgCc.x < -1.0 + Math.sqrt(this.radius)) {
         this.uVel.x = -this.uVel.x;
      }
      if (this.uOgCc.y > 1.0 - Math.sqrt(this.radius) || this.uOgCc.y < -1.0 + Math.sqrt(this.radius)) {
         this.uVel.y = -this.uVel.y;
      }

      this.uTime = new_time;

      //Scroll the gradient
      this.uGrad += 0.5 * delta;
      setUniform('1f', 'uGrad', this.uGrad);

      setUniform('3f', 'uOgCc', this.uOgCc.x, this.uOgCc.y, this.uOgCc.z);
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