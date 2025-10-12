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
     -1, 1,0, 0,0,1,
      1, 1,0, 0,0,1,
     -1,-1,0, 0,0,1,
      1,-1,0, 0,0,1,
   ])
};
function gl_start(canvas, scene) {
   setTimeout(function() {
      canvas.gl = canvas.getContext('webgl2');
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
         let vertexAttribute = (name, size, position) => {
            let attr = gl.getAttribLocation(gl.program, name);
            gl.enableVertexAttribArray(attr);
            gl.vertexAttribPointer(attr, size, gl.FLOAT, false, vertexSize * 4, position * 4);
         }

	 /*
	    Each vertex now has 6 numbers:
	    3 for the position attribute and
	    another 3 for the normal attribute.
	 */

         vertexAttribute('aPos', 3, 0);
         vertexAttribute('aNor', 3, 3);
      }
      canvas.setShaders(scene.vertexShader, scene.fragmentShader);
      setInterval(function() {
         if (scene.update)
	    scene.update([0,0,7]);
	 if (autodraw)
	    drawMesh(mesh);
      }, 30);
   }, 100);
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

let gl;
let setUniform = (type,name,a,b,c) => (gl['uniform'+type])(gl.getUniformLocation(gl.program,name), a,b,c);

// THIS IS A SIMPLE IMPLEMENTATION OF THE OPERATIONS NEEDED FOR MATRIX MANIPULATION.

let c = t => Math.cos(t);
let s = t => Math.sin(t);
let identity = () => [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
let move = (x,y,z) => [1,0,0,0, 0,1,0,0, 0,0,1,0, x,y,z,1];
let turnX = t => [1,0,0,0, 0,c(t),s(t),0, 0,-s(t),c(t),0, 0,0,0,1];
let turnY = t => [s(t),0,c(t),0, 0,1,0,0, c(t),0,-s(t),0, 0,0,0,1];
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


