let noiseCode = `
vec3  _s(vec3 i) { return cos(5.*(i+5.*cos(5.*(i.yzx+5.*cos(5.*(i.zxy+5.*cos(5.*i))))))); }
float _t(vec3 i, vec3 u, vec3 a) { return dot(normalize(_s(i + a)), u - a); }
float noise(vec3 p) {
   vec3 i = floor(p), u = p - i, v = 2.*mix(u*u, u*(2.-u)-.5, step(.5,u));
   return mix(mix(mix(_t(i, u, vec3(0.,0.,0.)), _t(i, u, vec3(1.,0.,0.)), v.x),
                  mix(_t(i, u, vec3(0.,1.,0.)), _t(i, u, vec3(1.,1.,0.)), v.x), v.y),
              mix(mix(_t(i, u, vec3(0.,0.,1.)), _t(i, u, vec3(1.,0.,1.)), v.x),
                  mix(_t(i, u, vec3(0.,1.,1.)), _t(i, u, vec3(1.,1.,1.)), v.x), v.y), v.z);
}`;
let phongCode = `
vec3 phong(vec3 N, vec3 L, vec3 W, vec3 diffuse, vec4 specular) {
   vec3 R = 2. * N * dot(N,L) - L;
   return diffuse      * max(0., dot(N, L)) +
          specular.rgb * pow(max(0.,dot(R,-W)), specular.a);
}
`;
let autodraw = true;
let vertexSize = 6;
let mesh = {
   triangle_strip: true,
   data: new Float32Array([
      -1, 1, 0, 0, 0, 1,
      1, 1, 0, 0, 0, 1,
      -1, -1, 0, 0, 0, 1,
      1, -1, 0, 0, 0, 1,
   ])
};
function gl_start(canvas, scene) {
   setTimeout(function () {
      canvas.gl = canvas.getContext('webgl2');
      canvas.setShaders = function (vertexShader, fragmentShader) {
         gl = this.gl;
         gl.program = gl.createProgram();
         function addshader(type, src) {
            let shader = gl.createShader(type);
            gl.shaderSource(shader, src);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
               console.log('Cannot compile shader:', gl.getShaderInfoLog(shader));
            gl.attachShader(gl.program, shader);
         };

         addshader(gl.VERTEX_SHADER, vertexShader);

         let i = fragmentShader.indexOf('float') + 6;
         addshader(gl.FRAGMENT_SHADER, fragmentShader.substring(0, i)
            + noiseCode
            + phongCode
            + fragmentShader.substring(i));

         gl.linkProgram(gl.program);
         if (!gl.getProgramParameter(gl.program, gl.LINK_STATUS))
            console.log('Could not link the shader program!');
         gl.useProgram(gl.program);
         gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
         gl.enable(gl.DEPTH_TEST);
         gl.depthFunc(gl.LEQUAL);

          vertexMap(['aPos',3,'aNor',3]);
     //     let vertexAttribute = (name, size, position) => {
     //        let attr = gl.getAttribLocation(gl.program, name);
     //        gl.enableVertexAttribArray(attr);
     //        gl.vertexAttribPointer(attr, size, gl.FLOAT, false, vertexSize * 4, position * 4);
     //     }

     //     /*
     //        Each vertex now has 6 numbers:
     //        3 for the position attribute and
     //        another 3 for the normal attribute.
     //     */

     //     vertexAttribute('aPos', 3, 0);
     //     vertexAttribute('aNor', 3, 3);
      }
      canvas.setShaders(scene.vertexShader, scene.fragmentShader);
      setInterval(function () {
         if (scene.update)
            scene.update([0, 0, 7]);
         if (autodraw)
            drawMesh(mesh);
      }, 30);
      if (scene.initialize) { scene.initialize(); }
      if (scene.events) {
         scene.events.forEach(evt => {
            if (evt.length == 2) {
               canvas.addEventListener(evt[0], evt[1]);
            } else {
               window.addEventListener(evt[0], evt[1]);
            }
         });
      }
   }, 100);
}

let vertexMap = map => {
   let vertexAttribute = (name, size, position) => {
      let attr = gl.getAttribLocation(gl.program, name);
      gl.enableVertexAttribArray(attr);
      gl.vertexAttribPointer(attr, size, gl.FLOAT, false, vertexSize * 4, position * 4);
   }
   vertexSize = 0;
   for (let n = 0 ; n < map.length ; n += 2)
      vertexSize += map[n+1];
   let index = 0;
   for (let n = 0 ; n < map.length ; n += 2) {
      vertexAttribute(map[n], map[n+1], index);
      index += map[n+1];
   }
}


/*
   The drawMesh() function does two things:

     (1) It downloads a mesh's data to the GPU;
     (2) It then renders the mesh on the GPU.

   Note that if the "triangle_strip" option is enabled in the mesh,
   the data is assumed to be in the form of a gl.TRIANGLE_STRIP.
   Otherwise the data is assumed to be in the form of gl.TRIANGLES.
*/

let drawMesh = mesh => {
   gl.bufferData(gl.ARRAY_BUFFER, mesh.data, gl.STATIC_DRAW);
   gl.drawArrays(mesh.triangle_strip ? gl.TRIANGLE_STRIP : gl.TRIANGLES,
      0, mesh.data.length / vertexSize);
}

let drawObj = (mesh, matrix, color) => {
   autodraw = false;
   let m = mxm(perspective(0,0,-.5),matrix);
   setUniform('Matrix4fv', 'uMF', false, m);
   setUniform('Matrix4fv', 'uMI', false, inverse(m));
   setUniform('4fv', 'uC', color ?? [1,1,1,1]);
   drawMesh(mesh);
}

let gl;
let setUniform = (type, name, a, b, c) => (gl['uniform' + type])(gl.getUniformLocation(gl.program, name), a, b, c);

// THIS IS A SIMPLE IMPLEMENTATION OF THE OPERATIONS NEEDED FOR MATRIX MANIPULATION.

// Shared global object.

let _ = {};

// SOME USEFUL FUNCTIONS

let add = (a,b) => { let v = []; for (let i=0 ; i<a.length ; i++) v.push(a[i] + b[i]); return v; }
let cross = (a,b) => [ a[1]*b[2] - a[2]*b[1], a[2]*b[0] - a[0]*b[2], a[0]*b[1] - a[1]*b[0] ];
let dot = (a,b) => { let s = 0 ; for (let i=0 ; i<a.length ; i++) s += a[i] * b[i]; return s; }
let ease = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - t - t); }
let evalBezier = (B,t) => (1-t)*(1-t)*(1-t)*B[0] + 3*(1-t)*(1-t)*t*B[1] + 3*(1-t)*t*t*B[2] + t*t*t*B[3];
let mix = (a,b,t) => { let c = []; for (let i=0 ; i<a.length ; i++) c[i] = a[i] + t*(b[i]-a[i]); return c; }
let norm = v => Math.sqrt(dot(v,v));
let normalize = v => { let s = norm(v); return v.length==3 ? [ v[0]/s,v[1]/s,v[2]/s ] : [ v[0]/s,v[1]/s ]; }
let resize = (v,s) => v.length==2 ? [ s*v[0], s*v[1] ] : [s*v[0], s*v[1], s*v[2] ];
let subtract = (a,b) => { let v = []; for (let i=0 ; i<a.length ; i++) v.push(a[i] - b[i]); return v; }

// THIS IS A SIMPLE IMPLEMENTATION OF THE OPERATIONS NEEDED FOR MATRIX MANIPULATION.

let c = t => Math.cos(t);
let s = t => Math.sin(t);
let identity = () => [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
let move = (x,y,z) => { if (y===undefined) {z=x[2];y=x[1];x=x[0];}
                        return [1,0,0,0, 0,1,0,0, 0,0,1,0, x,y,z,1]; }
let turnX = t => [1,0,0,0, 0,c(t),s(t),0, 0,-s(t),c(t),0, 0,0,0,1];
let turnY = t => [c(t),0,-s(t),0, 0,1,0,0, s(t),0,c(t),0, 0,0,0,1];
let turnZ = t => [c(t),s(t),0,0, -s(t),c(t),0,0, 0,0,1,0, 0,0,0,1];
let scale = (x,y,z) => [x,0,0,0, 0,y??x,0,0, 0,0,z??x,0, 0,0,0,1];
let perspective = (x,y,z) => [1,0,0,x, 0,1,0,y??x, 0,0,1,z??x, 0,0,0,1];

// Multiply two matrices.

let mxm = (a,b) => {
   let m = [];
   for (let c = 0 ; c < 16 ; c += 4)
   for (let r = 0 ; r < 4 ; r++)
      m.push( a[r]*b[c] + a[r+4]*b[c+1] + a[r+8]*b[c+2] + a[r+12]*b[c+3] );
   return m;
}

// A matrix transforms a point

let transform = (m,p) => {
   let x = p[0], y = p[1], z = p[2], w = p[3] ?? 1;
   return [
      m[0] * x + m[4] * y + m[ 8] * z + m[12] * w,
      m[1] * x + m[5] * y + m[ 9] * z + m[13] * w,
      m[2] * x + m[6] * y + m[10] * z + m[14] * w,
      m[3] * x + m[7] * y + m[11] * z + m[15] * w,
   ];
}
// Invert a matrix.

let inverse = src => {
   let dst = [], det = 0, cofactor = (c, r) => {
      let s = (i, j) => src[c+i & 3 | (r+j & 3) << 2];
      return (c+r & 1 ? -1 : 1) * ( (s(1,1)*(s(2,2)*s(3,3)-s(3,2)*s(2,3)))
                                  - (s(2,1)*(s(1,2)*s(3,3)-s(3,2)*s(1,3)))
                                  + (s(3,1)*(s(1,2)*s(2,3)-s(2,2)*s(1,3))) );
   }
   for (let n = 0 ; n < 16 ; n++) dst.push(cofactor(n >> 2, n & 3));
   for (let n = 0 ; n <  4 ; n++) det += src[n] * dst[n << 2];
   for (let n = 0 ; n < 16 ; n++) dst[n] /= det;
   return dst;
}

// Rotation matrix which brings the Z axis to a specified direction.

let aim = Z => {
   let X = normalize(cross([0,1,0], Z = normalize(Z))),
       Y = normalize(cross(Z, X));
   return [ X[0],X[1],X[2],0, Y[0],Y[1],Y[2],0, Z[0],Z[1],Z[2],0, 0,0,0,1 ];
}

// NESTABLE MATRIX OBJECT

function PMatrix() {
   let m = [identity()], top = 0;
   this.aim         = Z       => { m[top] = mxm(m[top],aim(Z)); return this; }
   this.call        = proc    => { proc(); return this; }
   this.get         = ()      => m[top];
   this.identity    = ()      => { m[top] = identity(); return this; }
   this.inverse     = ()      => { m[top] = inverse(m[top]); return this; }
   this.move        = (x,y,z) => { m[top] = mxm(m[top],move(x,y,z)); return this; }
   this.perspective = (x,y,z) => { m[top] = mxm(m[top], perspective(x,y,z)); return this; }
   this.pop         = ()      => { if (top > 0) top--; return this; }
   this.push        = ()      => { m[top+1] = m[top].slice(); top++; return this; }
   this.scale       = (x,y,z) => { m[top] = mxm(m[top], scale(x,y,z)); return this; }
   this.set         = matrix  => { m[top] = matrix; return this; }
   this.transform   = p       => { m[top] = transform(m[top],p); return this; }
   this.transpose   = ()      => { m[top] = transpose(m[top]); return this; }
   this.turnX       = a       => { m[top] = mxm(m[top], turnX(a)); return this; }
   this.turnY       = a       => { m[top] = mxm(m[top], turnY(a)); return this; }
   this.turnZ       = a       => { m[top] = mxm(m[top], turnZ(a)); return this; }
}

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

// SOME SIMPLE DEFAULT SHADERS

let Shader = {

defaultVertexShader : `\
#version 300 es
uniform mat4 uMF, uMI;
in  vec3 aPos, aNor;
out vec3 vPos, vNor;
void main() {
   vec4 pos = uMF * vec4(aPos, 1.);
   vec4 nor = vec4(aNor, 0.) * uMI;
   gl_Position = pos * vec4(1.,1.,-.1,1.);
   vPos = pos.xyz;
   vNor = nor.xyz;
}`,

defaultFragmentShader : `\
#version 300 es
precision highp float;
in  vec3 vPos, vNor;
out vec4 fragColor;
uniform vec3 uColor;

void main() {
   vec3 nor = normalize(vNor);
   float c = .1 + max(0., dot(vec3( .5),nor))
                + max(0., dot(vec3(-.5),nor));
   fragColor = vec4(c * uColor, 1.);
}`,

shinyFragmentShader : `\
#version 300 es
precision highp float;
in  vec3 vPos, vNor;
out vec4 fragColor;
uniform vec3 uColor;

void main() {
   vec3 L = vec3(.577), N = normalize(vNor);
   float d = dot(L,N), r = 2. * dot(L,N) * N.z - L.z;
   fragColor = vec4(uColor*(.1+max(0.,d)+max(0.,-d)*.5)
                    + pow(max(0., r),20.)
		    + pow(max(0.,-r),20.)*.5, 1.);
}`,

};


// // RESPOND TO THE USER'S MOUSE INPUT

// let mouse = { isDown: false, x: 0, y: 0};

// document.addEventListener('mousedown', e => {
//    color = [0,0,1];
//    mouse.isDown = true;
//    mouse.x = (e.x - gl.width/2 ) / (gl.width/2);
//    mouse.y = (gl.height/2 - e.y) / (gl.width/2);
//    if (mouse.down)
//       mouse.down();
// });

// document.addEventListener('mousemove', e => {
//    if (mouse.isDown) {
//       let x = (e.x - gl.width/2 ) / (gl.width/2);
//       let y = (gl.height/2 - e.y) / (gl.width/2);
//       if (mouse.drag)
//          mouse.drag(x - mouse.x, y - mouse.y);
//       mouse.x = x;
//       mouse.y = y;
//    }
// });

// document.addEventListener('mouseup', e => {
//    if (mouse.up)
//       mouse.up();
//    mouse.isDown = false;
// });

let linefont = [
   { name: ' ', paths: [
   ] },
   { name: '!', paths: [
        [ [30,0],[30,75] ],
        [ [25,100],[35,100],[35,90],[25,90],[25,100] ],
   ] },
   { name: '"', paths: [
        [ [20,0],[20,30] ],
        [ [40,0],[40,30] ],
   ] },
   { name: '#', paths: [
        [ [25,10],[15,90] ],
        [ [45,10],[35,90] ],
        [ [0,40],[60,40] ],
        [ [0,60],[60,60] ],
   ] },
   { name: '$', paths: [
        [ [50,20],[10,20],[10,50],[50,50],[50,80],[10,80] ],
        [ [25,0],[25,100] ],
        [ [35,0],[35,100] ],
   ] },
   { name: '%', paths: [
        [ [60,10],[0,90] ],
        [ [ 5, 20],[15, 20],[15,10],[ 5,10],[ 5, 20] ],
        [ [45, 90],[55, 90],[55,80],[45,80],[45, 90] ],
   ] },
   { name: '&', paths: [
        [ [60,100],[0,20],[15,0],[35,0],[50,20],[0,70],[0,100],[30,100],[60,70] ],
   ] },
   { name: '\'', paths: [
        [ [35,0],[25,30] ],
   ] },
   { name: '(', paths: [
        [ [40,0],[20,30],[20,70],[40,100] ],
   ] },
   { name: ')', paths: [
        [ [20,0],[40,30],[40,70],[20,100] ],
   ] },
   { name: '*', paths: [
        [ [30,25],[30,75] ],
        [ [ 7,35],[53,65] ],
        [ [53,35],[ 7,65] ],
   ] },
   { name: '+', paths: [
        [ [10,60],[50,60] ],
        [ [30,40],[30,80] ],
   ] },
   { name: ',', paths: [
        [ [30,80],[30,100],[15,120] ],
   ] },
   { name: '-', paths: [
        [ [10,60],[50,60] ],
   ] },
   { name: '.', paths: [
        [ [25,100],[35,100],[35,90],[25,90],[25,100] ],
   ] },
   { name: '/', paths: [
        [ [50,0],[10,100] ],
   ] },
   { name: '0', paths: [
        [ [15,100],[0,85],[0,15],[15,0],[45,0],[60,15],[60,85],[45,100],[15,100] ],
   ] },
   { name: '1', paths: [
        [ [10,20],[30,0],[30,100] ],
   ] },
   { name: '2', paths: [
        [ [0,30],[0,15],[15,0],[45,0],[60,15],[60,35],[0,100],[60,100] ],
   ] },
   { name: '3', paths: [
        [ [0,15],[15,0],[45,0],[60,15],[60,35],[40,50],[60,65],[60,85],[45,100],[15,100],[0,85] ],
   ] },
   { name: '4', paths: [
        [ [60,60],[0,60],[40,0],[40,100] ],
   ] },
   { name: '5', paths: [
        [ [60,0],[5,0],[5,40],[45,40],[60,55],[60,85],[45,100],[15,100],[0,85] ],
   ] },
   { name: '6', paths: [
        [ [0,55],[15,45],[45,45],[60,60],[60,85],[45,100],[15,100],[0,85],[0,15],[15,0],[45,0],[60,15] ],
   ] },
   { name: '7', paths: [
        [ [0,0],[60,0],[20,100] ],
   ] },
   { name: '8', paths: [
        [ [30,50],[45,50],[60,65],[60,85],[45,100],[15,100],[0,85],[0,65],[15,50],[40,50],[55,35],[55,15],[40,0],[20,0],[5,15],[5,35],[20,50],[30,50] ],
   ] },
   { name: '9', paths: [
        [ [60,45],[45,55],[15,55],[0,40],[0,15],[15,0],[45,0],[60,15],[60,85],[45,100],[15,100],[0,85] ],
   ] },
   { name: ':', paths: [
        [ [25, 50],[35, 50],[35,40],[25,40],[25, 50] ],
        [ [25,100],[35,100],[35,90],[25,90],[25,100] ],
   ] },
   { name: ';', paths: [
        [ [25, 50],[35, 50],[35,40],[25,40],[25, 50] ],
        [ [30,80],[30,100],[15,120] ],
   ] },
   { name: '<', paths: [
        [ [50,30],[10,50],[50,70] ],
   ] },
   { name: '=', paths: [
        [ [10,38],[50,38] ],
        [ [10,62],[50,62] ],
   ] },
   { name: '>', paths: [
        [ [10,30],[50,50],[10,70] ],
   ] },
   { name: '?', paths: [
        [ [10,20],[10,0],[50,0],[50,40],[30,40],[30,60] ],
        [ [25,100],[35,100],[35,90],[25,90],[25,100] ],
   ] },
   { name: '0', paths: [
        [ [50,115],[15,115],[0,95],[0,30],[15,15],[45,15],[60,30],[60,85],[45,97],[25,97],[17,87],[17,40],[25,35],[45,35],[60,55] ],
   ] },
   { name: 'A', paths: [
        [ [0,100],[30,0],[60,100] ],
        [ [10,100*2/3],[50,100*2/3] ],
   ] },
   { name: 'B', paths: [
        [ [0,100],[0,50],[40,50],[55,65],[55,85],[40,100],[0,100] ],
        [ [0,50],[0,0],[35,0],[50,15],[50,35],[35,50] ],
   ] },
   { name: 'C', paths: [
        [ [60,100],[0,100],[0,0],[60,0] ],
   ] },
   { name: 'D', paths: [
        [ [0,100],[0,0],[40,0],[60,20],[60,80],[40,100],[0,100] ],
   ] },
   { name: 'E', paths: [
        [ [60,100],[0,100],[0,0],[60,0] ],
        [ [0,50],[40,50], ],
   ] },
   { name: 'F', paths: [
        [ [0,100],[0,0],[60,0] ],
        [ [0,50],[40,50], ],
   ] },
   { name: 'G', paths: [
        [ [30,50],[60,50],[60,100],[0,100],[0,0],[60,0] ],
   ] },
   { name: 'H', paths: [
        [ [0,0],[0,100] ],
        [ [60,0],[60,100] ],
        [ [0,50],[60,50] ],
   ] },
   { name: 'I', paths: [
        [ [30,0],[30,100] ],
        [ [10,0],[50,0] ],
        [ [10,100],[50,100] ],
   ] },
   { name: 'J', paths: [
        [ [0,60],[0,100],[60,100],[60,0] ],
   ] },
   { name: 'K', paths: [
        [ [0,0],[0,100] ],
        [ [60,0],[0,50],[60,100] ],
   ] },
   { name: 'L', paths: [
        [ [0,0],[0,100],[60,100] ],
   ] },
   { name: 'M', paths: [
        [ [0,100],[0,0],[30,50],[60,0],[60,100] ],
   ] },
   { name: 'N', paths: [
        [ [0,100],[0,0],[60,100],[60,0] ],
   ] },
   { name: 'O', paths: [
        [ [0,100],[0,0],[60,0],[60,100],[0,100] ],
   ] },
   { name: 'P', paths: [
        [ [0,100],[0,0],[60,0],[60,50],[0,50] ],
   ] },
   { name: 'Q', paths: [
        [ [0,100],[0,0],[60,0],[60,70],[30,100],[0,100] ],
        [ [30,70],[60,100] ],
   ] },
   { name: 'R', paths: [
        [ [0,100],[0,0],[35,0],[50,15],[50,35],[35,50] ],
        [ [0,50],[30,50],[60,100] ],
   ] },
   { name: 'S', paths: [
        [ [0,100],[60,100],[60,50],[0,50],[0,0],[60,0] ],
   ] },
   { name: 'T', paths: [
        [ [30,0],[30,100] ],
        [ [0,0],[60,0] ],
   ] },
   { name: 'U', paths: [
        [ [0,0],[0,100],[60,100],[60,0] ],
   ] },
   { name: 'V', paths: [
        [ [0,0],[30,100],[60,0] ],
   ] },
   { name: 'W', paths: [
        [ [0,0],[10,100],[30,50],[50,100],[60,0] ],
   ] },
   { name: 'X', paths: [
        [ [0,0],[60,100] ],
        [ [60,0],[0,100] ],
   ] },
   { name: 'Y', paths: [
        [ [0,0],[30,50],[60,0] ],
        [ [30,50],[30,100] ],
   ] },
   { name: 'Z', paths: [
        [ [0,0],[60,0],[0,100],[60,100] ],
   ] },
   { name: '[', paths: [
        [ [40,0],[20,0],[20,100],[40,100] ],
   ] },
   { name: '\\', paths: [
        [ [10,0],[50,100] ],
   ] },
   { name: ']', paths: [
        [ [20,0],[40,0],[40,100],[20,100] ],
   ] },
   { name: '^', paths: [
        [ [10,30],[30,0],[50,30] ],
   ] },
   { name: '_', paths: [
        [ [0,100],[60,100] ],
   ] },
   { name: '`', paths: [
        [ [25,0],[35,25] ],
   ] },
   { name: 'a', paths: [
        [ [50,75],[30,100],[10,100],[10,50],[50,50],[50,100] ],
   ] },
   { name: 'b', paths: [
        [ [10,0],[10,100],[50,100],[50,50],[10,50] ],
   ] },
   { name: 'c', paths: [
        [ [50,50],[10,50],[10,100],[50,100] ],
   ] },
   { name: 'd', paths: [
        [ [50,0],[50,100],[10,100],[10,50],[50,50] ],
   ] },
   { name: 'e', paths: [
        [ [10,75],[50,75],[50,50],[10,50],[10,100],[50,100] ],
   ] },
   { name: 'f', paths: [
        [ [50,0],[30,0],[30,100] ],
        [ [10,50],[50,50] ],
   ] },
   { name: 'g', paths: [
        [ [50,100],[10,100],[10,50],[50,50],[50,125],[10,125] ],
   ] },
   { name: 'h', paths: [
        [ [10,0],[10,100] ],
        [ [10,50],[50,50],[50,100] ],
   ] },
   { name: 'i', paths: [
        [ [30,50],[30,100] ],
        [ [25,20],[35,20],[35,10],[25,10],[25,20] ],
   ] },
   { name: 'j', paths: [
        [ [50,50],[50,125],[10,125],[10,100] ],
        [ [45,20],[55,20],[55,10],[45,10],[45,20] ],
   ] },
   { name: 'k', paths: [
        [ [10,0],[10,100] ],
        [ [50,50],[10,75],[50,100] ],
   ] },
   { name: 'l', paths: [
        [ [20,0],[30,0],[30,100],[40,100] ],
   ] },
   { name: 'n', paths: [
        [ [0,100],[0,50],[15,50],[30,75],[45,50],[60,50],[60,100] ],
   ] },
   { name: 'n', paths: [
        [ [10,100],[10,50] ],
        [ [10,75],[30,50],[50,50],[50,100] ],
   ] },
   { name: 'o', paths: [
        [ [50,50],[10,50],[10,100],[50,100],[50,50] ],
   ] },
   { name: 'p', paths: [
        [ [10,100],[50,100],[50,50],[10,50],[10,125] ],
   ] },
   { name: 'q', paths: [
        [ [50,100],[10,100],[10,50],[50,50],[50,125],[60,125] ],
   ] },
   { name: 'r', paths: [
        [ [10,100],[10,50] ],
        [ [10,75],[30,50],[50,50] ],
   ] },
   { name: 's', paths: [
        [ [50,50],[10,50],[10,75],[50,75],[50,100],[10,100] ],
   ] },
   { name: 't', paths: [
        [ [30,25],[30,100],[50,100] ],
        [ [10,50],[50,50] ],
   ] },
   { name: 'u', paths: [
        [ [50,50],[50,100] ],
        [ [50,75],[30,100],[10,100],[10,50] ],
   ] },
   { name: 'v', paths: [
        [ [10,50],[30,100],[50,50] ],
   ] },
   { name: 'w', paths: [
        [ [0,50],[15,100],[30,50],[45,100],[60,50] ],
   ] },
   { name: 'x', paths: [
        [ [10,50],[50,100] ],
        [ [50,50],[10,100] ],
   ] },
   { name: 'y', paths: [
        [ [10,50],[30,100] ],
        [ [20,125],[50,50] ],
   ] },
   { name: 'z', paths: [
        [ [10,50],[50,50],[10,100],[50,100] ],
   ] },
   { name: '{', paths: [
        [ [40,0],[20,10],[20,40],[10,50],[20,60],[20,90],[40,100] ],
   ] },
   { name: '|', paths: [
        [ [30,0],[30,100] ],
   ] },
   { name: '}', paths: [
        [ [20,0],[40,10],[40,40],[50,50],[40,60],[40,90],[20,100] ],
   ] },
   { name: '~', paths: [
        [ [0,55],[20,45],[40,55],[60,45] ],
   ] },
];


// ADDING A TEXTURE

let addTexture = (index, folder, src) => {
   let image = new Image();
   image.onload = () => {

      // MAKE THIS THE ACTIVE TEXTURE

      gl.activeTexture(gl.TEXTURE0 + index);

      // CREATE A NEW TEXTURE OBJECT

      gl.bindTexture(gl.TEXTURE_2D,
                     gl.createTexture());

      // SPECIFY HOW SRC IMAGE WILL BE LAID OUT

      gl.texImage2D(gl.TEXTURE_2D,
                    0,
                    gl.RGBA,
                    gl.RGBA,
                    gl.UNSIGNED_BYTE,
                    image);

      // SPECIFY HOW IT'S FILTERED WHEN MAGNIFIED

      gl.texParameteri(gl.TEXTURE_2D,
                       gl.TEXTURE_MAG_FILTER,
                       gl.LINEAR);

      // SPECIFY HOW IT'S FILTERED WHEN VERY SMALL

      gl.texParameteri(gl.TEXTURE_2D,
                       gl.TEXTURE_MIN_FILTER,
                       gl.LINEAR);

      // GENERATE THE MIP MAP PYRAMID

      gl.generateMipmap(gl.TEXTURE_2D);
   }

   // SPECIFY TEXTURE SRC TO BEGIN ACTUAL LOADING

   image.src = folder + src;
}



