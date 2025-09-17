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

   //Recommended bounce angle and ball speed from ping pong math equation
   this.MAX_ANGLE = 5 * Math.PI / 12;
   this.SPEED = 1.0; 

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
   in  vec3 vPos;
   out vec4 fragColor;
   void main() {
   float radius = 0.005;
   vec3 origin = vPos - uOgCc;
   fragColor = vec4(0.);
   vec3 p = vec3(vPos.xy, sqrt(radius - dot(origin, origin)));
   bool inC = p.z > 0.;
   float height = 0.1/2.0;
   float width = height * 4.0;

   bool inS = uMinX <= vPos.x && vPos.x <= uMaxX && uMinY <= vPos.y && vPos.y <= uMaxY;
   if(inC){
      fragColor = vec4(1.0);
   }
   if (inS){
      fragColor = vec4(0.462, 0.167, 0.620, 1.0);
   }
   if (inC && inS){
      fragColor = vec4(0.0, 1.0, 0.0, 1.0);
   }
}`;

   this.events = [['keydown', (evt) => {
      
      const delta = 0.06;
      let x = 0;
      // let y = 0;
      // //If moving up or down, move by delta
      // if (evt.key === 'ArrowUp') {
      //    y = delta;
      // } else if (evt.key === 'ArrowDown') {
      //    y = -delta;
      // }

      //If moving left or right, move by delta
      if (evt.key === 'ArrowLeft') {
         x = -delta;
      } else if (evt.key === 'ArrowRight') {
         x = delta;
      }
      //Update the center of the square
      this.uOgSq.x += x;
      // this.uOgSq.y += y;

      //Update the boundaries of the square
      this.uMinX = Math.max(-1.0, this.uOgSq.x - this.width);
      this.uMaxX = Math.min(1.0, this.uOgSq.x + this.width);
      this.uMinY = Math.max(-1.0, this.uOgSq.y - this.height);
      this.uMaxY = Math.min(1.0, this.uOgSq.y + this.height);

      //Now update the square uniforms
      this.initialize(false);
   
      console.log(evt.key);

   }]];

   this.initialize = (all=true) => {
      if(all){
         setUniform('3f', 'uOgCc', this.uOgCc.x, this.uOgCc.y, this.uOgCc.z);
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
      if(this.checkIntersection()){
         let intersectX = Math.max(this.uMinX, Math.min(this.uOgCc.x, this.uMaxX));
         let normal = (intersectX - this.uOgSq.x) / this.width;
         
         let angle = normal * this.MAX_ANGLE;

         //Flip y and x because we are a horizontal square
         this.uVel.y = this.SPEED * Math.cos(angle);
         this.uVel.x = this.SPEED * -Math.sin(angle);
      }
      this.uOgCc.x += this.uVel.x * delta;
      this.uOgCc.y += this.uVel.y * delta;

      //Otherwise, check if we hit a boundary and reverse direction
      if(this.uOgCc.x > 1.0 - Math.sqrt(this.radius) || this.uOgCc.x < -1.0 + Math.sqrt(this.radius)){
         this.uVel.x = -this.uVel.x;
      }
      if(this.uOgCc.y > 1.0 - Math.sqrt(this.radius) || this.uOgCc.y < -1.0 + Math.sqrt(this.radius)){
         this.uVel.y = -this.uVel.y;
      }

      this.uTime = new_time; 

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
console.log("HW 1 Scene loaded");