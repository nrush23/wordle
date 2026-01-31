// 2-LINK INVERSE KINEMATICS

let ik = (A,a,b,C,aim) => {
   C = [ C[0]-A[0], C[1]-A[1], C[2]-A[2] ];
   let dot = (A,B) => A[0]*B[0]+A[1]*B[1]+A[2]*B[2], B=[], D=[];
   let cc = dot(C,C), x = (1+(a*a-b*b)/cc)/2, c = dot(C,aim)/cc;
   for (let i = 0 ; i < 3 ; i++) D[i] = aim[i] - c * C[i];
   let y = Math.sqrt(Math.max(0, a*a - cc*x*x) / dot(D,D));
   for (let i = 0 ; i < 3 ; i++) B[i] = A[i] + x*C[i] + y*D[i];
   return B;
}
// SPRING

function Spring() {
   this.getPosition = () => P;
   this.setDamping  = d  => D = d;
   this.setForce    = f  => F = f;
   this.setMass     = m  => M = Math.max(0.001, m);
   this.update = e => {
      V += (F - P) / M * e;
      P  = (P + V) * (1 - D * e);
   }
   let D = 1, F = 0, M = 1, P = 0, V = 0;
}

// SOME USEFUL PRIMITIVE SHAPES

let Shape = {

cube: [
  -1,-1,-1, 0, 0,-1,  1,-1,-1, 0, 0,-1,  1, 1,-1, 0, 0,-1,
   1, 1,-1, 0, 0,-1, -1, 1,-1, 0, 0,-1, -1,-1,-1, 0, 0,-1,
  -1,-1, 1, 0, 0, 1,  1,-1, 1, 0, 0, 1,  1, 1, 1, 0, 0, 1,
   1, 1, 1, 0, 0, 1, -1, 1, 1, 0, 0, 1, -1,-1, 1, 0, 0, 1,
  
  -1,-1,-1, 0,-1, 0,  1,-1,-1, 0,-1, 0,  1,-1, 1, 0,-1, 0,
   1,-1, 1, 0,-1, 0, -1,-1, 1, 0,-1, 0, -1,-1,-1, 0,-1, 0,
  -1, 1,-1, 0, 1, 0,  1, 1,-1, 0, 1, 0,  1, 1, 1, 0, 1, 0,
   1, 1, 1, 0, 1, 0, -1, 1, 1, 0, 1, 0, -1, 1,-1, 0, 1, 0,

  -1,-1,-1,-1, 0, 0, -1, 1,-1,-1, 0, 0, -1, 1, 1,-1, 0, 0,
  -1, 1, 1,-1, 0, 0, -1,-1, 1,-1, 0, 0, -1,-1,-1,-1, 0, 0,
   1,-1,-1, 1, 0, 0,  1, 1,-1, 1, 0, 0,  1, 1, 1, 1, 0, 0,
   1, 1, 1, 1, 0, 0,  1,-1, 1, 1, 0, 0,  1,-1,-1, 1, 0, 0,
],

parametric: (f,nu,nv,other) => {
   let V = [];
   for (let j = 0 ; j < nv ; j++) {
      for (let i = 0 ; i <= nu ; i++) {
         V.push(f(i/nu,j/nv,other));
         V.push(f(i/nu,(j+1)/nv,other));
      }
      V.push(f(1,(j+1)/nv,other));
      V.push(f(0,(j+1)/nv,other));
   }
   return V.flat();
},

sphere: (nu,nv) => Shape.parametric((u,v) => {
   let theta = 2 * Math.PI * u;
   let phi = Math.PI * (v - 1/2);
   let cu = Math.cos(theta);
   let su = Math.sin(theta);
   let cv = Math.cos(phi);
   let sv = Math.sin(phi);
   let x = cu * cv, y = su * cv, z = sv;
   return [x,y,z, x,y,z];
},nu,nv),

tube: n => Shape.parametric((u,v) => {
   let theta = 2 * Math.PI * u;
   let c = Math.cos(theta);
   let s = Math.sin(theta);
   return [c,s,2*v-1, c,s,0];
},n,2),

cubeMesh: () => {
   return {
      triangle_strip: false,
      data: new Float32Array(Shape.cube)
   };
},

sphereMesh: (nu, nv) => {
   return {
      triangle_strip: true,
      data: new Float32Array(Shape.sphere(nu,nv))
   };
},

tubeMesh: n => {
   return {
      triangle_strip: true,
      data: new Float32Array(Shape.tube(n))
   };
},

};