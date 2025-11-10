
// PREDEFINE SOME USEFUL SHADER FUNCTIONS

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

// INITIALIZE THE WEBGL RENDERER

let autodraw = true;
let vertexSize = 6;
let mesh = {
  triangle_strip: true,
  data: new Float32Array([
     -1, 1,0, 0,0,1,
      1, 1,0, 0,0,1,
     -1,-1,0, 0,0,1,
      1,-1,0, 0,0,1,
   ])
};
function gl_start(canvas, scene) {
   setTimeout(function() {
      canvas.gl = canvas.getContext('webgl2');
      canvas.gl.width = canvas.width;
      canvas.gl.height = canvas.height;
      canvas.setShaders = function(vertexShader, fragmentShader) {
         gl = this.gl;
	 gl.program = gl.createProgram();
         function addshader(type, src) {
            let shader = gl.createShader(type);
            gl.shaderSource(shader, src);
            gl.compileShader(shader);
            if (! gl.getShaderParameter(shader, gl.COMPILE_STATUS))
               console.log('Cannot compile shader:', gl.getShaderInfoLog(shader));
            gl.attachShader(gl.program, shader);
         };

         addshader(gl.VERTEX_SHADER, vertexShader);

	 let i = fragmentShader.indexOf('float') + 6;
         addshader(gl.FRAGMENT_SHADER, fragmentShader.substring(0,i)
	                             + noiseCode
	                             + phongCode
		                     + fragmentShader.substring(i));

         gl.linkProgram(gl.program);
         if (! gl.getProgramParameter(gl.program, gl.LINK_STATUS))
            console.log('Could not link the shader program!');
         gl.useProgram(gl.program);
         gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
         gl.enable(gl.DEPTH_TEST);
         gl.depthFunc(gl.LEQUAL);
         vertexMap(['aPos',3,'aNor',3]);
      }
      canvas.setShaders(scene.vertexShader, scene.fragmentShader);
      setInterval(function() {
         if (scene.update)
	    scene.update([0,0,7]);
	 if (autodraw)
	    drawMesh(mesh);
      }, 10);
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
   setUniform('3fv', 'uColor', color ?? [1,1,1]);
   drawMesh(mesh);
}

let gl;
let setUniform = (type,name,a,b,c) => (gl['uniform'+type])(gl.getUniformLocation(gl.program,name), a,b,c);

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

function Matrix() {
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

// RESPOND TO THE USER'S MOUSE INPUT

let mouse = { isDown: false, x: 0, y: 0};

document.addEventListener('mousedown', e => {
   color = [0,0,1];
   mouse.isDown = true;
   mouse.x = (e.x - gl.width/2 ) / (gl.width/2);
   mouse.y = (gl.height/2 - e.y) / (gl.width/2);
   if (mouse.down)
      mouse.down();
});

document.addEventListener('mousemove', e => {
   if (mouse.isDown) {
      let x = (e.x - gl.width/2 ) / (gl.width/2);
      let y = (gl.height/2 - e.y) / (gl.width/2);
      if (mouse.drag)
         mouse.drag(x - mouse.x, y - mouse.y);
      mouse.x = x;
      mouse.y = y;
   }
});

document.addEventListener('mouseup', e => {
   if (mouse.up)
      mouse.up();
   mouse.isDown = false;
});

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

let textSampleLarge =
`
It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness, it was the epoch
of belief, it was the epoch of incredulity, it was the season of Light, it was the season of Darkness, it was the spring of hope,
it was the winter of despair, we had everything before us, we had nothing before us, we were all going direct to Heaven, we were
all going direct the other way-in short, the period was so far like the present period, that some of its noisiest authorities
insisted on its being received, for good or for evil, in the superlative degree of comparison only.

There were a king with a large jaw and a queen with a plain face, on the throne of England; there were a king with a large jaw
and a queen with a fair face, on the throne of France. In both countries it was clearer than crystal to the lords of the State
preserves of loaves and fishes, that things in general were settled for ever.

It was the year of Our Lord one thousand seven hundred and seventy-five. Spiritual revelations were conceded to England at that
favoured period, as at this. Mrs. Southcott had recently attained her five-and-twentieth blessed birthday, of whom a prophetic
private in the Life Guards had heralded the sublime appearance by announcing that arrangements were made for the swallowing up of
London and Westminster. Even the Cock-lane ghost had been laid only a round dozen of years, after rapping out its messages, as
the spirits of this very year last past (supernaturally deficient in originality) rapped out theirs. Mere messages in the earthly
order of events had lately come to the English Crown and People, from a congress of British subjects in America: which, strange
to relate, have proved more important to the human race than any communications yet received through any of the chickens of the
Cock-lane brood.

France, less favoured on the whole as to matters spiritual than her sister of the shield and trident, rolled with exceeding
smoothness down hill, making paper money and spending it. Under the guidance of her Christian pastors, she entertained herself,
besides, with such humane achievements as sentencing a youth to have his hands cut off, his tongue torn out with pincers, and
his body burned alive, because he had not kneeled down in the rain to do honour to a dirty procession of monks which passed
within his view, at a distance of some fifty or sixty yards. It is likely enough that, rooted in the woods of France and Norway,
there were growing trees, when that sufferer was put to death, already marked by the Woodman, Fate, to come down and be sawn
into boards, to make a certain movable framework with a sack and a knife in it, terrible in history. It is likely enough that in
the rough outhouses of some tillers of the heavy lands adjacent to Paris, there were sheltered from the weather that very day,
rude carts, bespattered with rustic mire, snuffed about by pigs, and roosted in by poultry, which the Farmer, Death, had already
set apart to be his tumbrils of the Revolution. But that Woodman and that Farmer, though they work unceasingly, work silently,
and no one heard them as they went about with muffled tread: the rather, forasmuch as to entertain any suspicion that they were
awake, was to be atheistical and traitorous.

In England, there was scarcely an amount of order and protection to justify much national boasting. Daring burglaries by armed
men, and highway robberies, took place in the capital itself every night; families were publicly cautioned not to go out of town
without removing their furniture to upholsterers’ warehouses for security; the highwayman in the dark was a City tradesman in
the light, and, being recognised and challenged by his fellow-tradesman whom he stopped in his character of “the Captain,”
gallantly shot him through the head and rode away; the mail was waylaid by seven robbers, and the guard shot three dead, and
then got shot dead himself by the other four, “in consequence of the failure of his ammunition:” after which the mail was robbed
in peace; that magnificent potentate, the Lord Mayor of London, was made to stand and deliver on Turnham Green, by one
highwayman, who despoiled the illustrious creature in sight of all his retinue; prisoners in London gaols fought battles with
their turnkeys, and the majesty of the law fired blunderbusses in among them, loaded with rounds of shot and ball; thieves
snipped off diamond crosses from the necks of noble lords at Court drawing-rooms; musketeers went into St. Giles’s, to search for
contraband goods, and the mob fired on the musketeers, and the musketeers fired on the mob, and nobody thought any of these
occurrences much out of the common way. In the midst of them, the hangman, ever busy and ever worse than useless, was in
constant requisition; now, stringing up long rows of miscellaneous criminals; now, hanging a housebreaker on Saturday who had
been taken on Tuesday; now, burning people in the hand at Newgate by the dozen, and now burning pamphlets at the door of
Westminster Hall; to-day, taking the life of an atrocious murderer, and to-morrow of a wretched pilferer who had robbed a
farmer’s boy of sixpence.

All these things, and a thousand like them, came to pass in and close upon the dear old year one thousand seven hundred and
seventy-five. Environed by them, while the Woodman and the Farmer worked unheeded, those two of the large jaws, and those other
two of the plain and the fair faces, trod with stir enough, and carried their divine rights with a high hand. Thus did the year
one thousand seven hundred and seventy-five conduct their Greatnesses, and myriads of small creatures-the creatures of this
chronicle among the rest-along the roads that lay before them.
`;

let textSampleCode =
`
import * as cg from "../render/core/cg.js";
import { G3 } from "../util/g3.js";
import { cities } from "../util/major_cities.js";

export const init = async model => {
  let lo3=23.7752, hi3=49.9566, lo4=-125.1162, hi4=-69.0202, y=1;

  let map = model.add('square').setTxtr('media/textures/grid_map.jpg')
                 .move(0,y,0).turnX(-Math.PI/2).scale(.9,.6,1);

  let table = model.add('cube').move(0,y/2,0).scale(.9,y/2-.0001,.6);

  let g3 = new G3(model, draw => {
   draw.color('blue').textHeight(.04).text(1/delta >> 0, [0,2.5,0]);

   draw.textHeight(.02).lineWidth(.004);
   for (let n = 0 ; n < cities.length ; n++) {
     let x = 1.675 * (cities[n][4] - lo4) / (hi4 - lo4) - 0.880;
     let z = 1.190 * (cities[n][3] - lo3) / (hi3 - lo3) - 0.60;
     let r = cities[n][2] / 10000000;
     draw.color('red');
     if (r > .4) {
      draw.line([x,y,-z],[x,y+r/2,-z]);
      draw.line([x,y+r/2,-z],[x,y+r,-z]);
     }
     else
      draw.line([x,y,-z],[x,y+r,-z]);
     draw.color('blue');
     if (draw.text(cities[n][0], [x,y+r+.018,-z]) < .2) {
      draw.textHeight(.008);
      draw.text('pop. ' + cities[n][2], [x,y+r+.006,-z]);
      draw.textHeight(.02);
     }
   }
  });

  let delta = 1/30;
  model.animate(() => {
   g3.update();
   delta = .9 * delta + .1 * model.deltaTime;
  });
}
`;
