
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

// NOISE FUNCTION

let noise = (x,y,z) => {
   let normalize = v => (s => v.map(a => a/s))(Math.sqrt(dot(v,v))), c = Math.cos;
   let f=Math.floor,i=f(x),j=f(y),k=f(z),dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
   let r = (x,y,z) => c(5 * (x + 5 * c(5 * (y + 5 * c(5 * (z + 5 * c(5 * x)))))));
   let s = (x,y,z) => normalize([ r(x,y,z),r(y,z,x),r(z,x,y) ]),u=x-i,v=y-j,w=z-k;
   let e = t => t < 0.5 ? 2 * t*t : 2*t * (2-t) - 1, U = e(u), V = e(v), W = e(w);
   let t = (x,y,z) => dot(s(i+x,j+y,k+z),[u-x,v-y,w-z]), m = (a,b,t) => a+(b-a)*t;
   return m( m( m( t(0,0,0), t(1,0,0), U), m( t(0,1,0), t(1,1,0), U ), V ),
             m( m( t(0,0,1), t(1,0,1), U), m( t(0,1,1), t(1,1,1), U ), V ), W );
}

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

// ADDING A TEXTURE

let addTexture = (index, src) => {
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
                       gl.LINEAR_MIPMAP_NEAREST);

      // SPECIFY HOW IT'S FILTERED WHEN VERY SMALL

      gl.texParameteri(gl.TEXTURE_2D,
                       gl.TEXTURE_MIN_FILTER,
                       gl.LINEAR_MIPMAP_NEAREST);

      // GENERATE THE MIP MAP PYRAMID

      gl.generateMipmap(gl.TEXTURE_2D);
   }

   // SPECIFY TEXTURE SRC TO BEGIN ACTUAL LOADING

   image.src = 'textures/' + src;
}

