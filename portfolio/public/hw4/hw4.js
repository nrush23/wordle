
function Scene() {
   this.SHOOT = false;
   this.CUBES_X = 0;

   this.SHAPES = [];
   this.ZOMBIE = createZombie();
   this.Z_ANGLE = 0;
   this.CUBES = createSpiral();

   this.ENVIRONMENT = createEnvironment();

   this.SHAPES = this.SHAPES.concat(this.ENVIRONMENT);
   this.SHAPES = this.SHAPES.concat(this.CUBES);
   this.SHAPES = this.SHAPES.concat(this.ZOMBIE);

   this.uQ = new Array(this.SHAPES.length);
   this.uP = new Array(this.SHAPES.length);
   this.COLORS = new Array(this.SHAPES.length);
   this.SUM = 0;
   for (let i = 0; i < this.SHAPES.length; i++) {
      this.uP[i] = this.SHAPES[i].PARTS;
      this.uQ[i] = this.SHAPES[i].Q;
      this.COLORS[i] = this.SHAPES[i].COLOR;
      this.SUM += this.uP[i];
   }
   this.COLORS = this.COLORS.flat();
   this.uQ = this.uQ.flat();
   this.NS = this.uP.length;


   this.ZOMBIE.forEach(shape => {
      shape.applyAll();
      shape.move(0, 0.25, -20);
      shape.scale(0.5, 0.5, 0.5);
      shape.applyAll();
      shape.setPosition(0, 0, -5);
   });


   function rgb(r, g, b, a) {
      return [r / 255, g / 255, b / 255, a];
   }

   function createZombie() {
      const SKIN = rgb(26, 145, 66, 1);
      let LEFT_ARM = new Cube();
      LEFT_ARM.move(-2, 0, -7);
      LEFT_ARM.scale(0.25, .75, 0.5);
      LEFT_ARM.move(0.75, 0.5, 0);
      LEFT_ARM.turnZ(Math.PI / 4);
      LEFT_ARM.COLOR = SKIN;

      let BODY = new Cube();
      BODY.move(0, 0, -7);
      BODY.COLOR = rgb(216, 189, 114, 1);

      let RIGHT_ARM = new Cube();
      RIGHT_ARM.move(-2, 0, -7);
      RIGHT_ARM.turnZ(7 * Math.PI / 4);
      RIGHT_ARM.scale(0.25, 0.75, 0.5);
      RIGHT_ARM.move(3.25, 0.5, 0);
      RIGHT_ARM.COLOR = SKIN;

      let RIGHT_LEG = new Cube();
      RIGHT_LEG.move(0, 0, -7);
      RIGHT_LEG.scale(0.4, 1, 1);
      RIGHT_LEG.move(0.5, -2, 0);
      RIGHT_LEG.COLOR = rgb(156, 122, 28, 1);

      let LEFT_LEG = new Cube();
      LEFT_LEG.move(0, 0, -7);
      LEFT_LEG.scale(0.4, 1, 1);
      LEFT_LEG.move(-0.5, -2, 0);
      LEFT_LEG.COLOR = RIGHT_LEG.COLOR;

      let HEAD = new Cube();
      HEAD.move(0, 1.5, -7);
      HEAD.scale(0.5, 0.5, 0.5);
      HEAD.COLOR = SKIN;

      ZOMBIE = [HEAD, LEFT_ARM, RIGHT_ARM, BODY, RIGHT_LEG, LEFT_LEG];

      return ZOMBIE;
   }

   function createSpiral() {
      const Cubes = new Array(8);
      for (let i = 0; i < Cubes.length; i++) {
         Cubes[i] = new Cube();
         Cubes[i].scale(0.05, 0.05, 0.05);
         Cubes[i].COLOR = rgb(255, 229, 153, 1);
         Cubes[i].applyAll();
      }
      return Cubes;
   }

   function createEnvironment() {
      let Environment = new Array(2);
      const GROUND = new Cube();
      GROUND.scale(5.5, 0.01, 30);
      GROUND.move(0, -1.25, 0);
      GROUND.COLOR = rgb(125, 125, 0, 1);

      const TABLE = new Cube();
      TABLE.scale(1.0, 0.2, 1.0);
      TABLE.applyAll();
      TABLE.move(0, -0.5, 4);
      TABLE.COLOR = rgb(139, 69, 19, 1);

      const LEFT_BORDER = new Cube();
      LEFT_BORDER.scale(0.125, 1, 0.125);
      LEFT_BORDER.applyAll();
      LEFT_BORDER.move(-0.45, 0, 4);
      LEFT_BORDER.COLOR = rgb(139, 69, 19, 1);

      const RIGHT_BORDER = new Cube();
      RIGHT_BORDER.scale(0.125, 1, 0.125);
      RIGHT_BORDER.applyAll();
      RIGHT_BORDER.move(0.45, 0, 4);
      RIGHT_BORDER.COLOR = rgb(139, 69, 19, 1);
      Environment = [GROUND, TABLE, LEFT_BORDER, RIGHT_BORDER];
      return Environment;
   }

   this.vertexShader = `\
#version 300 es
in  vec3 aPos;
out vec3 vPos;
void main() {
   gl_Position = vec4(aPos, 1.);
   vPos = aPos;
}`;

   this.fragmentShader = `\
#version 300 es
precision highp float;
uniform float uTime;
uniform vec3 uViewPoint;
uniform mat4 uQ[`+ this.SUM + `];
uniform int uP[`+ this.uP.length + `];
uniform vec4 uC[`+ this.SHAPES.length + `];
in  vec3 vPos;
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

vec3 rayEq(vec3 V, vec3 W, mat4 Q) {

   float A = Q[0].x, B = Q[1].x+Q[0].y, C = Q[2].x+Q[0].z, D = Q[3].x+Q[0].w,
                     E = Q[1].y       , F = Q[2].y+Q[1].z, G = Q[3].y+Q[1].w,
                                        H = Q[2].z       , I = Q[3].z+Q[2].w,
                                                           J = Q[3].w       ;

   float a = A * W.x * W.x +
             B * W.x * W.y +
             C * W.z * W.x +
             E * W.y * W.y +
             F * W.y * W.z +
             H * W.z * W.z ;

   float b = 2. * A * V.x * W.x +
                  B * (W.x * V.y + V.y * W.x) +
                  C * (V.z * W.x + V.x * W.z) +
                  D * W.x +
             2. * E * V.y * W.y +
                  F * (V.y * W.z + V.z * W.y) +
                  G * W.y +
             2. * H * V.z * W.z +
                  I * W.z;

   float c = A * V.x * V.x +
             B * V.x * V.y +
             C * V.z * V.x +
             D * V.x       +
             E * V.y * V.y +
             F * V.y * V.z +
             G * V.y       +
             H * V.z * V.z +
             I * V.z       +
             J;

   return vec3(a,b,c);
}

vec2 findRoots(vec3 eq) {
   float a = eq.x, b = eq.y, c = eq.z;
   vec2 t = vec2(-1.);
   float discr = b * b - 4. * a * c;
   if (discr >= 0.)
      t = vec2(-b - sqrt(discr), -b + sqrt(discr)) / (2. * a);
   return t;
}

vec3 normalQ(mat4 Q, vec3 P) {

   float A = Q[0].x, B = Q[1].x+Q[0].y, C = Q[2].x+Q[0].z, D = Q[3].x+Q[0].w,
                     E = Q[1].y       , F = Q[2].y+Q[1].z, G = Q[3].y+Q[1].w,
                                        H = Q[2].z       , I = Q[3].z+Q[2].w,
                                                           J = Q[3].w       ;

   return normalize(vec3(2. * A * P.x + C * P.z + B * P.y + D,
                         2. * E * P.y + F * P.z + B * P.x + G,
                         2. * H * P.z + F * P.y + C * P.x + I));
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
   float s = sqrt(.5 + .5 * sin(20. * P.x + 8. * v));
   return vec3(.8,.7,.5) * vec3(s,s*s,s*s*s);
}

vec3 ground(vec3 P){
   float v = turbulence(1.5 * P);
   float s = sqrt(.5 + .5 * cos(1. * P.x + 8. * v));
   return vec3(.8,0.3,.0) * vec3(s,s*s,s*s*s);
}

void main() {
   // fragColor = vec4(0.6, 0.8, 1.0, 1.0);
   fragColor = vec4(0.0);

   vec3 V = uViewPoint;
   vec3 W = normalize(vPos-V);

   vec3 color1 = vec3(0.);

   //First color the background
   float t = 0.5 + 0.5 * vPos.y;
   if (t > .5)
      t += .3 * turbulence(vPos + vec3(.05*uTime,0.,.1*uTime));
   vec3 c = vec3(0.,0.,0.);
   c = mix(c, vec3(0.1,0.,0.0), min(t,.5));
   if (t > 0.65)
      c = mix(c, vec3(.2,.1,0.0), (t-.65) / (.7 - .65));
   fragColor = vec4(sqrt(c), 1.);

   vec2 tI [`+ this.NS + `];
   int k = 0;
   float closest = 1000.;
   //Iterate through each Shape
   for(int i = 0; i < `+ this.NS + `; i++){
      tI[i] = vec2(-1.,1000.);
      //Assume that each shape has uP[i] parts
      for(int j = 0; j < uP[i]; j++){
         vec2 tQ = findRoots(rayEq(V, W, uQ[k]));
         if(tQ.x > tI[i].x){
            vec3 N = normalQ(uQ[k], V + tQ.x * W);
            color1 = vec3(.1 + max(0., dot(N, vec3(1.0))));
            tI[i].x = tQ.x;
         }
         if(tQ.y < tI[i].y){
            tI[i].y = tQ.y;
         }
         k++;
      }
      
      if(tI[i].x > 0. && tI[i].x < tI[i].y && tI[i].x < closest){
         vec3 P = V + tI[i].x * W;
         if(i==0){
            fragColor = uC[i]* mix(mix(vec4(marble(P),1.0), uC[i], 0.75), vec4(ground(P),0.1), 0.21);
         }else if (1 <= i && i <= 3){
            fragColor = mix(uC[i], vec4(wood(P, uC[i].rgb),1.0), 0.75);
         }else if (i >= 4 && i <= 11){
            fragColor = mix(uC[i], vec4(cubeTexture2(P, uC[i]),1.0), 1.0);
         }else if (12 <= i && i <= 14){
            fragColor = mix(uC[i], vec4(marble(P), 1.0), 0.15);
         }else{
            fragColor = mix(uC[i], vec4(ground(P), 1.0), 0.25);
         }
         fragColor *= vec4(sqrt(color1), 1.0);
         closest = tI[i].x;
      }
   }
}`;


   let startTime = Date.now() / 1000;
   let deltaTime = Date.now() / 1000;

   this.events = [['keydown', (evt) => {
      if (this.uQ.length > 0) {
         const delta = 0.06;
         let x = 0;
         let y = 0;
         //If moving left or right, move by delta
         if (evt.key === 'ArrowLeft' || evt.key === 'a') {
            x = -delta;
         } else if (evt.key === 'ArrowRight' || evt.key === 'd') {
            x = delta;
         }

         //If moving left or right, move by delta
         if (evt.key === 'ArrowUp' || evt.key === 'w') {
            y = delta;
         } else if (evt.key === 'ArrowDown' || evt.key === 's') {
            y = -delta;
         }
         this.ZOMBIE.forEach(shape => {
            shape.move(x, y, 0);
            shape.turnZ(x);
         })

         this.reloadShapes();
      }

   }], ['mousemove', (evt) => {
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

         this.CUBES_X = coord;
      }
   }], ['click', (evt) => {
      this.SHOOT = true;
   }]];

   this.initialize = (viewPoint = [0, 0, 7]) => {
      setUniform('3fv', 'uViewPoint', viewPoint);
      setUniform('1iv', 'uP', this.uP);
      setUniform('Matrix4fv', 'uQ', false, this.uQ);
      setUniform('4fv', 'uC', this.COLORS);
   }

   this.update = (viewPoint = [0, 0, 0]) => {
      let delta = Date.now() / 1000 - deltaTime;
      let time = Date.now() / 1000 - startTime;
      setUniform('1f', 'uTime', time);

      if (this.SHOOT) {
         this.animateSpiral(delta);
      } else {
         this.initializeCubes();
      }
      this.walk(delta);
      this.reloadShapes();


      deltaTime = Date.now() / 1000;

      setUniform('Matrix4fv', 'uQ', false, this.uQ);
   }


   this.walk = (time) => {
      const V = { x: 0, y: 0, z: 3 };
      for (let i = 0; i < this.ZOMBIE.length; i++) {
         this.ZOMBIE[i].move(0, 0, V.z * time);
         if (this.ZOMBIE[i].pos.z >= 15) {
            this.resetZombie();
            return;
         }
      }
   }

   this.resetZombie = () => {
      const OFFSET_X = 2*Math.random() - 1;
      this.ZOMBIE.forEach(shape => {
         shape.clearRotation();
         shape.setPosition(OFFSET_X, 0, -5);
      })
   }

   this.animate = (time) => {
      const angle = (Math.sin(time) + 1) / 2 * Math.PI / 2;

      for (let i = 2; i < this.ZOMBIE.length; i++) {
         this.ZOMBIE[i].turnX(angle - this.Z_ANGLE - Math.PI / 4);
      }
      this.Z_ANGLE = angle;
   }

   //Need to have a total distance we are allowed to travel
   //Each update, travel time * velocity

   //Travel each cube along a spiral rotate by 2PI/ i degrees
   this.theta_prev = new Array(this.CUBES.length);
   for (let i = 0; i < this.CUBES.length; i++) {
      this.theta_prev[i] = Math.PI * 2 * i / this.CUBES.length;
   }
   this.animateSpiral = (time) => {
      let V = { x: 2, y: 0.1, z: -20 };


      let r = 0.2;

      for (let i = 0; i < this.CUBES.length; i++) {
         let new_theta = this.theta_prev[i] + V.x * time;
         const d = { x: r * Math.sin(new_theta) - r * Math.sin(this.theta_prev[i]), y: V.y * time * (i + 1) / 10, z: r * Math.cos(new_theta) - r * Math.cos(this.theta_prev[i]) + V.z * time };
         this.CUBES[i].move(d.x, d.y, d.z);
         this.CUBES[i].turnY(d.z);
         this.CUBES[i].turnX(d.x);
         if (this.CUBES[i].pos.z <= -27) {
            this.resetCubes();
         } else {
            this.theta_prev[i] = new_theta;
         }
      }
   }

   this.initializeCubes = () => {
      for (let i = 0; i < this.CUBES.length; i++) {
         this.CUBES[i].setPosition(this.CUBES_X, 0, 0);
         this.CUBES[i].clearRotation();
      }
   }

   this.resetCubes = () => {
      this.SHOOT = false;
      for (let i = 0; i < this.CUBES.length; i++) {
         this.theta_prev[i] = Math.PI * 2 * i / this.CUBES.length;
         const pos = this.CUBES[i].pos;
         this.CUBES[i].move(-pos.x, -pos.y, -pos.z);
      }
   }

   this.reloadShapes = () => {
      let uq = [];
      this.SHAPES.forEach(shape => {
         uq.push(shape.Q);
      });
      this.uQ = uq.flat();
   }

}
console.log("HW 4 Scene loaded");

