/**
 * PHYSICS FROM: https://vanhunteradams.com/Pico/Galton/Collisions.html#Bouncing-off-a-round-peg,-with-coefficient-of-restitution
 */


/**
 * Rectangle class to define 2D regions of a rectangle, unfinished.
 */
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

   constructor(uOrigin, width, height, ID) {
      this.width = width;
      this.height = height;
      this.ID = ID;
      this.setOrigin(uOrigin.x, uOrigin.y, uOrigin.z);
   }

   /**
    * Update function to adjust the boundaries of a rectangular region with
    * the current origin.
    */
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

   /* Change the origin of the rectangle and update its boundaries*/
   setOrigin(xP, yP, zP = 0.0) {
      this.uOrigin = { x: xP, y: yP, z: zP };
      // setUniform('3f', 'uOrigin' + this.ID, this.uOrigin.x, this.uOrigin.y, this.uOrigin.z);
      this.update();
   }

   /** Return the origin, width, and height as a packed array.
    *  Additional 0.0 padding for vec3 syntax in WebGL.
    */
   getPack() {
      return [this.uOrigin.x, this.uOrigin.y, this.uOrigin.z, this.width, this.height, 0.0];
   }

   /* Check if Sphere S intersects with this rectangle*/
   checkIntersection(S) {
      let X = Math.max(this.uMinX, Math.min(S.uO.x, this.uMaxX));
      let Y = Math.max(this.uMinY, Math.min(S.uO.y, this.uMaxY));
      let dX = X - S.uO.x;
      let dY = Y - S.uO.y;
      let dist = dX ** 2 + dY ** 2;
      return dist <= S.uR;
   }
}

/**
 * Sphere class to define regions of 3D spheres, assumes you have an array
 * to set the uniform values.
 */
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
   }

   /*Change the origin of the sphere*/
   setOrigin(xP, yP, zP = 0.0) {
      this.uO = { x: xP, y: yP, z: zP };
      // setUniform('4fv', 'uS' + this.ID, xP, yP, zP, this.uR);
   }

   /*Update function not needed in this case*/
   update() {

   }

   /*Return the origin and radius as a packed array*/
   getPack() {
      return [this.uO.x, this.uO.y, this.uO.z, this.uR];
   }

   /*Return the color and alpha as a packed array*/
   getColor() {
      return [this.uC.r, this.uC.g, this.uC.b, this.uC.a];
   }

   /*Check if two spheres intersect by finding if the distance between their centers is less than the sum of their radii*/
   checkIntersection(S) {
      const d = Math.sqrt((S.uO.x - this.uO.x) ** 2 + (S.uO.y - this.uO.y) ** 2 + (S.uO.z - this.uO.z) ** 2);
      return d < (S.uR + this.uR);
   }

   /*Change the color of the sphere*/
   setColor(C) {
      this.uC = C;
   }
}



/**
 * Our default scene function, creates the objects and calculates physics
 * in a render loop.
 * @param {*} plink_path: path for the plink sound 
 * @param {*} music_path: path for the background music
 */
function Scene(plink_path = null, music_path = null) {

   /** Load music function to repeatedly attempt playing the background song
    *  if provided.
    */
   this.loadMusic = () => {
      this.music.play().catch(() => {
         setTimeout(() => {
            this.loadMusic();
         }, 1);
      });
   }

   //Initialize our plinko sound
   if (plink_path != null) {
      this.audio = new Audio(plink_path);
      this.audio.loop = false;
   }

   //Initialize our circus music and attempt to start
   if (music_path != null) {
      const music = new Audio(music_path);
      music.loop = true;
      music.volume = 0.05;
      music.autoplay = true;
      this.music = music;
      this.loadMusic();
   }

   //Initialize uTime to now and make the initial velocity of our ball 0
   //By default, we are not dropping the ball
   this.uTime = 1.0;
   this.uV = { x: 0.0, y: 0.0, z: 0.0 };
   this.DROP = false;

   //NSW = Number of Spheres on the Wall, NSP = Number of Pegs, BALL = Index of our Ball
   let NSW = 11 * 2;
   let NSP = 30;
   this.BALL = NSW + NSP;

   //Spheres = array to hold all of the spheres in our scene
   //[0, NSW) = Spheres on the wall, [NSW, NSW+NSP) = Pegs, [NSW + NSP] = Ball
   this.SPHERES = Array(NSW + NSP + 1);

   //Colors = array to hold the different colors we use in the Sphere Walls
   this.COLORS = [rgb(0, 62, 106, 0.8), rgb(0, 126, 167, 0.8), rgb(95, 221, 229, 0.8)];
   this.COLOR = 0;

   //rem = how much width is available after spawning our different spheres
   let rem = 2; //Length (1-(-1))/R;

   //Using R as our radius, spawn 11 spheres along each wall using COLOR = 0
   let R = Math.sqrt(0.01);
   for (let i = 0; i < NSW; i += 2) {
      this.SPHERES[i] = new Sphere({ x: -1 + R, y: -1 + (R * i), z: 0.0 }, R, this.COLORS[this.COLOR], i);
      this.SPHERES[i + 1] = new Sphere({ x: 1 - R, y: -1 + (R * i), z: 0.0 }, R, this.COLORS[this.COLOR], i + 1);
   }

   //The remaining width is -4R smaller after spawning our walls
   rem -= R * 4;

   //Prepare to generate our grid (row, col) of Pegs
   let row = 6;
   let col = NSP / row;

   //Calculate our padding by separating the remaining width into equal (col + 1)
   //sections
   let padding = rem / (col + 1);

   //Now generate each peg using a radius of r
   //Each peg is spawned on the right side of each gap with a starting position of (-1 + 2R)
   let r = 0.04;
   for (let j = 0; j < row; j++) {
      for (let i = 0; i < col; i++) {
         this.SPHERES[NSW + (j * col) + i] = new Sphere({ x: -1 + 2 * R + padding * (i + 1), y: -1 + r + (j * r * 8), z: 0.0 }, r, rgb(255, 140, 148, 0), NSW + (j * col) + i);
      }
   }

   //Now generate our ball with a radius of rB = 1.75r and spawn it
   //one ball away from the top middle of the screen
   let rB = 1.75 * r;
   this.SPHERES[NSW + NSP] = new Sphere({ x: 0, y: 1 - 2 * rB, z: 0.0 }, rB, { r: 0.0, g: 1.0, b: 1.0, a: 0.0 }, this.BALL);

   //Indices used to change the brightness of our pegs
   this.ROW = 6;
   this.COL = 0;

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

   uniform vec4 uS[`+ this.SPHERES.length + `];
   uniform vec4 uSC[`+ this.SPHERES.length + `];

   //Check if there is a valid solution to our ray from V->W
   //hitting our Sphere and return all possible solutions
   vec2 raySphere(vec3 V, vec3 W, vec4 S){
      V -= S.xyz;
      float b = dot(V, W);
      float d = b * b - dot(V, V) + S.w * S.w;
      if (d < 0.){
         return vec2(1001., 1000.);
      }
      return vec2(-b - sqrt(d), -b + sqrt(d));
   }
   
   //Check if there is a ray from our current point to the light
   //that hits each sphere
   bool inShadow(vec3 P, vec3 L){
      for (int i = 0 ; i < `+ this.SPHERES.length + ` ; i++) {
         vec2 tt = raySphere(P, L, uS[i]);
         if (tt.x < tt.y && tt.x > 0.)
            return true;
      }
      return false;
   }
   
   //Only use one Light source 1 unit in front of us
   //Add light only if we are not in shadow
   vec3 shadeSphere(vec4 S, vec3 P, vec3 C){
      vec3 N = (P - S.xyz) / S.w;
      vec3 L = normalize(vec3(0.0,0.0,1.0));
      vec3 shade = vec3(.1);
      if (!inShadow(P, L)){
         shade += vec3(1.0) * max(0., dot(N, L));
      }

      return C * shade;
   }

   void main() {

      //Viewpoint is 5 units in front of us
      vec3 V = vec3 (0.,0.,5.);
      vec3 W = normalize(vPos-V);
      float t = 100.;

      //Background is a blue/teal gradient
      // fragColor = vec4(0.0, (1.0+sin(vPos.y/2.0))/2.0, 1.0, 1.0);
      float e = 0.01;
      if(abs(sin(vPos.x*8.0 - uTime/10.0)/2.0 - vPos.y) <= e && -1.0 <= vPos.x && vPos.x <= -0.75){
         fragColor = vec4(1.0, 1.0, 1.0, 1.0);
      }else{
         fragColor = vec4(0.0, (1.0+sin(vPos.y/2.0))/2.0, 1.0, 1.0);
      }
      

      // //Color our spheres
      // for(int i = 0; i < `+ this.SPHERES.length + `; i++){
      //    vec2 tt = raySphere(V, W, uS[i]);
      //    if (tt.x < tt.y && tt.x > 0. && tt.x < t){
      //       t = tt.x;
      //       vec3 P = V + t * W;
      //       vec3 a = shadeSphere(uS[i], P, uSC[i].xyz);
      //       a += uSC[i].a * uSC[i].xyz;
      //       vec4 F = vec4(a, 1.0);
      //       fragColor = vec4(sqrt(F.rgb), F.a);
      //    }
      // }
}`;

   /**
    * Define events to add to our canvas
    */
   this.events = [
      //Set our mousemove function to change the position of our ball
      //as long as it is not currently dropping
      ['mousemove', (evt) => {
         if (!this.DROP) {

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
            coord = Math.max(-1 + 2 * R + rB, Math.min(1 - 2 * R - rB, coord));

            //Now retrieve our Ball and set its origin to have our new x coordinate
            const s = this.SPHERES[this.BALL];
            s.setOrigin(coord, s.uO.y, s.uO.z);

            //Update our uS array of spheres
            let S = Array(this.SPHERES.length);
            for (let i = 0; i < this.SPHERES.length; i++) {
               S[i] = this.SPHERES[i].getPack();
            }
            setUniform('4fv', 'uS', S.flat());
         }
      }],
      //On mouse click, change game state to DROP and
      //set the uTime to now for proper gravity calculations.
      //Clear the lights on the pegs
      ['click', (evt) => {
         this.DROP = true;
         this.uTime = Date.now() / 1000;
         this.clearPegs();
      }],
      //When the user presses R, reset the board
      ['keydown', (evt) => {
         if (evt.key === 'r') {
            this.reset();
         }
      }]]

   //Iniatialize our scene by packing our spheres and their colors
   //Start a 1s interval to flip our sphere walls when the ball is not dropping
   //Start a 1/10s interval to raindrop effect our pegs
   this.initialize = (all = true) => {

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

      setInterval(() => {
         if (!this.DROP) {
            this.ROW = (this.ROW == 0) ? 5 : this.ROW - 1;
         }
      }, 100);

   }

   //Clear our pegs by setting the brightness of each one back to 0.0
   this.clearPegs = () => {
      let C = Array(this.SPHERES.length);
      for (let i = 0; i < this.SPHERES.length; i++) {
         if (NSW <= i && i < NSW + NSP) {
            this.SPHERES[i].uC.a = 0.0;
         }
         C[i] = this.SPHERES[i].getColor();
      }
      setUniform('4fv', 'uSC', C.flat());
   }

   /* Helper function to convert standard RGB into 1.0 scale */
   function rgb(r, g, b, a) {
      return { r: r / 255, g: g / 255, b: b / 255, a: a };
   }

   /* Helper function to normalize a vector */
   function normalize(V) {
      let length = Math.sqrt(V.x ** 2 + V.y ** 2 + V.z ** 2);
      if (length == 0) {
         return V;
      }
      return { x: V.x / length, y: V.y / length, z: V.z / length };
   }

   /* Helper function to compute the dot products of 2 3x1 vectors */
   function dot(V, N) {
      return V.x * N.x + V.y * N.y + V.z * N.z;
   }

   /* Helper function to compute the magnitude of a 3D vector */
   function magnitude(V) {
      return Math.sqrt(dot(V, V));
   }

   /* Scene function to change the color of the Sphere Walls */
   this.switchLights = (idx) => {
      return this.COLORS[(this.COLOR + idx) % this.COLORS.length];
   }

   /* Scene function to reset the board by ending the DROP state, putting the Ball back to its origin,  and clearing velocity */
   this.reset = () => {
      this.DROP = false;
      const s = this.SPHERES[this.BALL];
      s.setOrigin(0.0, 1.0 - 2 * rB, s.uO.z);
      this.uV = { x: 0.0, y: 0.0, z: 0.0 };
      let S = Array(this.SPHERES.length);
      for (let i = 0; i < this.SPHERES.length; i++) {
         S[i] = this.SPHERES[i].getPack();
      }
      setUniform('4fv', 'uS', S.flat());
   }

   /* Scene function to change the pegs to signify a win animation */
   this.win = () => {


   }

   /* Game update loop */
   this.update = () => {

      //First, calculate the current time and the difference between the previous time
      // const new_time = (Date.now() / 1000);
      // const delta = new_time - this.uTime;
      // this.uTime = new_time;
      this.uTime++;
      setUniform('1f', 'uTime', this.uTime);
      // console.log(this.uTime);
   }

}
console.log("HW 2 Scene loaded");

