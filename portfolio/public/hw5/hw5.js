function Scene() {
   let C = new Cube();
   mesh = {
      data: C.V
   };

   this.meshes = [mesh, mesh];

   this.vertexShader = `\
#version 300 es
uniform mat4 uMF, uMI;
in  vec3 aPos, aNor;
out vec3 vPos, vNor;
void main() {
   vec4 pos = uMF * vec4(aPos, 1.);
   vec4 nor = vec4(aNor, 0.) * uMI;
   gl_Position = pos * vec4(1.,1.,-1.,1.);
   vPos = pos.xyz;
   vNor = nor.xyz;
}`;

   this.fragmentShader = `\
#version 300 es
precision highp float;
in  vec3 vPos, vNor;
out vec4 fragColor;

void main() {
   vec3 nor = normalize(vNor);
   float c = .1 + max(0., dot(vec3(.5),nor));
   fragColor = vec4(c,c,c, 1.);
}`;

   let startTime = Date.now() / 1000;
   C.scale(0.3, 0.3, 0.3);
   let m = scale(0.3, 0.3, 0.3);
   console.log(C.S);
   console.log(m);
   let prev = startTime;
   autodraw = false;
   this.update = () => {
      let time = Date.now() / 1000 - startTime;
      let delta = Date.now() / 1000 - prev;

      C.move(0, 0, -0.5*delta);

      let m = mxm(move(-1,0,0), mxm(perspective(0, 0, -0.5),
         mxm(turnX(time),
            mxm(turnY(time),
               scale(.3, .3, .3)))));

      prev = Date.now() / 1000;

      setUniform('Matrix4fv', 'uMF', false, m);
      setUniform('Matrix4fv', 'uMI', false, inverse(m));
      drawMesh(mesh);
      setUniform('Matrix4fv', 'uMF', false, C.Q.m);
      setUniform('Matrix4fv', 'uMI', false, C.QI.m);
      drawMesh(mesh);
   }

}