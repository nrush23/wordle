function Scene() {

this.vertexShader = `#version 300 es
in  vec3 aPos;
out vec3 vPos;
void main() {
   gl_Position = vec4(aPos, 1.);
   vPos = aPos;
}`;

this.fragmentShader = `#version 300 es
precision highp float;
in  vec3 vPos;
out vec4 fragColor;
void main() {
   fragColor = vec4(.5 - .5 * vPos, 1.);
}`;
} 
console.log("HW 1 Scene loaded");