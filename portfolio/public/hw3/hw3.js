
function Scene() {


   this.uQ = [];
   let C1 = new Cube();
   C1.move(-1, 1, -20);
   C1.scale(0.5, 0.2, 0.5);

   let C2 = new Cube();
   C2.move(1, -1, -20);
   C2.scale(0.5, 0.5, 0.5);

   let S1 = new Sphere(1 / 9, 1, 1 / 4, -1);
   S1.move(0, 0, 0);
   S1.scale(0.2, 0.2, 0.2)

   let S2 = new Sphere();
   S2.m = [...S1.m];
   S2.move(0, 0.35, 0);
   S2.scale(0.5, 0.5, 0.15);

   let S3 = new Sphere();
   S3.scale(0.03, 0.05, 0.05);
   S3.move(0, 0, 0.36);

   let S4 = new Sphere();
   let S5 = new Sphere();
   let S6 = new Sphere();
   let S7 = new Sphere();
   S4.m = [...S3.m];
   S4.move(-0.2, 0, 0);
   S5.m = [...S3.m];
   S5.move(-0.4, 0, 0);
   S6.m = [...S3.m];
   S6.move(0.2, 0, 0);
   S7.m = [...S3.m];
   S7.move(0.4, 0, 0);

   this.uQ = [S1.m, S2.m, S3.m, S4.m, S5.m, S6.m, S7.m, C1.m, C2.m].flat();
   this.uP = [1, 1, 1, 1, 1, 1, 1, 3, 3];
   this.SUM = 13;
   this.NS = this.uP.length;
   this.SHAPES = [S1, S2, S3, S4, S5, S6, S7, C1, C2];
   this.COLORS = [rgb(96, 96, 96, 1.0), rgb(51, 255, 153, 1.0), rgb(0, 255, 0, 1), rgb(0, 255, 0, 1), rgb(0, 255, 0, 1), rgb(0, 255, 0, 1), rgb(0, 255, 0, 1), rgb(255, 255, 153, 1), rgb(255, 255, 153, 1)].flat();

   function rgb(r, g, b, a) {
      return [r / 255, g / 255, b / 255, a];
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

void main() {
   fragColor = vec4(0.);

   vec3 V = uViewPoint;
   vec3 W = normalize(vPos-V);

   vec3 color1 = vec3(0.);

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
            color1 = vec3(.1 + max(0., dot(N, vec3(0.5))));
            tI[i].x = tQ.x;
         }
         if(tQ.y < tI[i].y){
            tI[i].y = tQ.y;
         }
         k++;
      }
      
      if(tI[i].x > 0. && tI[i].x < tI[i].y && tI[i].x < closest){
         fragColor =uC[i] *  vec4(sqrt(color1), 1.0);
         closest = tI[i].x;
      }
   }
}`;


   let startTime = Date.now() / 1000;

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

         S1.move(x, y, 0);
         S2.move(x, y, 0);
         S3.move(x, y, 0);
         S4.move(x, y, 0);
         S5.move(x, y, 0);
         S6.move(x, y, 0);
         S7.move(x, y, 0);
         S1.turnZ(x);
         S2.turnZ(x);
         S3.turnZ(x);
         S4.turnZ(x);
         S5.turnZ(x);
         S6.turnZ(x);
         S7.turnZ(x);

         this.reloadShapes();
      }

   }]];

   this.initialize = (viewPoint = [0, 0, 7]) => {
      setUniform('3fv', 'uViewPoint', viewPoint);
      setUniform('1iv', 'uP', this.uP);
      setUniform('Matrix4fv', 'uQ', false, this.uQ);
      setUniform('4fv', 'uC', this.COLORS);
   }

   this.update = (viewPoint = [0, 0, 7]) => {
      let time = Date.now() / 1000 - startTime;
      setUniform('1f', 'uTime', time);
      let V = {x: 0, y: 0, z:0.01};

      C2.move(time*V.x, time*V.y, time*V.z);

      C1.move(1.5* time*V.x, 1.5*time*V.y, time*1.5*V.z);

      if (C2.pos.z >= 6){
         C2.scale(Math.sin(Math.random()) +0.5, Math.sin(Math.random()) +0.5, Math.sin(Math.random()) +0.5);
         C2.move(-C2.pos.x, -C2.pos.y, -C2.pos.z);
         C2.move(2*Math.sin(Math.random()) - 1, 2*Math.sin(Math.random()) - 1, -20);
      }

      if(C1.pos.z >= 6){
         C1.scale(Math.sin(Math.random()) +0.5, Math.sin(Math.random()) +0.5, Math.sin(Math.random()) +0.5);
         C1.move(-C1.pos.x, -C1.pos.y, -C1.pos.z);
         C1.move(2*Math.sin(Math.random()) - 1, 2*Math.sin(Math.random()) - 1, -20);
      }
      this.reloadShapes();

      setUniform('Matrix4fv', 'uQ', false, this.uQ);
   }

   this.reloadShapes = () => {
      let uq = [];
      this.SHAPES.forEach(shape => {
         uq.push(shape.m);
      });
      this.uQ = uq.flat();
   }

}
console.log("HW 3 Scene loaded");

