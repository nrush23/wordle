export default class WebGLRenderer {
    noiseCode = `
vec3  _s(vec3 i) { return cos(5.*(i+5.*cos(5.*(i.yzx+5.*cos(5.*(i.zxy+5.*cos(5.*i))))))); }
float _t(vec3 i, vec3 u, vec3 a) { return dot(normalize(_s(i + a)), u - a); }
float noise(vec3 p) {
   vec3 i = floor(p), u = p - i, v = 2.*mix(u*u, u*(2.-u)-.5, step(.5,u));
   return mix(mix(mix(_t(i, u, vec3(0.,0.,0.)), _t(i, u, vec3(1.,0.,0.)), v.x),
                  mix(_t(i, u, vec3(0.,1.,0.)), _t(i, u, vec3(1.,1.,0.)), v.x), v.y),
              mix(mix(_t(i, u, vec3(0.,0.,1.)), _t(i, u, vec3(1.,0.,1.)), v.x),
                  mix(_t(i, u, vec3(0.,1.,1.)), _t(i, u, vec3(1.,1.,1.)), v.x), v.y), v.z);
}`;
    phongCode = `
vec3 phong(vec3 N, vec3 L, vec3 W, vec3 diffuse, vec4 specular) {
   vec3 R = 2. * N * dot(N,L) - L;
   return diffuse      * max(0., dot(N, L)) +
          specular.rgb * pow(max(0.,dot(R,-W)), specular.a);
}
`;
    autodraw = true; 
    vertexSize = 6;
    mesh = {
        triangle_strip: true,
        data: new Float32Array([
            -1, 1, 0, 0, 0, 1,
            1, 1, 0, 0, 0, 1,
            -1, -1, 0, 0, 0, 1,
            1, -1, 0, 0, 0, 1,
        ])
    };

    gl;
    // replaces global _ 
    // Shared global object.
    cache = {}; // let _ = {};

    constructor() {

    }
    gl_start(canvas, scene) {
        //react compatability data
        let timeoutId = null;
        let tickIntervalId = null;
        let disposed = false;

        const listeners = [];
        const addListener = (target, type, handler, opts) => {
            target.addEventListener(type, handler, opts);
            listeners.push(() => target.removeEventListener(type, handler, opts));
        };

        // keep track of set timeout incase of mounting and unmounting
        timeoutId = setTimeout(() => {
            if (disposed) return; // in case react component unmounted

            canvas.gl = canvas.getContext('webgl2');
            canvas.setShaders =(vertexShader, fragmentShader) => {
                console.log(this.gl);
                this.gl = canvas.gl;
                this.gl.program = this.gl.createProgram();
                function addshader(gl,type, src) {;
                    let shader = gl.createShader(type);
                    gl.shaderSource(shader, src);
                    gl.compileShader(shader);
                    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
                        console.log('Cannot compile shader:', gl.getShaderInfoLog(shader));
                    gl.attachShader(gl.program, shader);
                };

                addshader(this.gl,this.gl.VERTEX_SHADER, vertexShader);

                let i = fragmentShader.indexOf('float') + 6;
                addshader(this.gl,this.gl.FRAGMENT_SHADER, fragmentShader.substring(0, i)
                    + this.noiseCode
                    + this.phongCode
                    + fragmentShader.substring(i));

                this.gl.linkProgram(this.gl.program);
                if (!this.gl.getProgramParameter(this.gl.program, this.gl.LINK_STATUS))
                    console.log('Could not link the shader program!');
                this.gl.useProgram(this.gl.program);
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.gl.createBuffer());
                this.gl.enable(this.gl.DEPTH_TEST);
                this.gl.depthFunc(this.gl.LEQUAL);

                this.vertexMap(['aPos', 3, 'aNor', 3]);
            }
            canvas.setShaders(scene.vertexShader, scene.fragmentShader);

            //keep track of render loop interval
            tickIntervalId = setInterval(() =>{
                if (disposed) return; // don't render if disposed

                if (scene.update)
                    scene.update([0, 0, 7]);
                if (this.autodraw)
                    drawMesh(mesh);
            }, 30);

            if (scene.initialize) { scene.initialize(); }
            if (scene.events) {
                scene.events.forEach((evt) => {
                    const [type, handler] = evt;
                    // your convention: length==2 => canvas, else window
                    if (evt.length == 2) addListener(canvas, type, handler);
                    else addListener(window, type, handler);
                });
            }
        }, 100);

        // return dispose function
        return () => {
            disposed = true;
            if (timeoutId) clearTimeout(timeoutId);
            if (tickIntervalId) clearInterval(tickIntervalId);

            // remove listeners
            for (const off of listeners) off();

            // tell the scene to clean itself up (intervals, eventbus, etc.)
            if (scene?.dispose) scene.dispose();

            // optional: release pointer lock if held
            if (document.pointerLockElement === canvas) document.exitPointerLock();

            // canvas.gl = null; // maybe need to trigger faster dispose
        };
    }

    vertexMap(map){
        let vertexAttribute = (name, size, position) => {
            let attr = this.gl.getAttribLocation(this.gl.program, name);
            this.gl.enableVertexAttribArray(attr);
            this.gl.vertexAttribPointer(attr, size, this.gl.FLOAT, false, this.vertexSize * 4, position * 4);
        }
        this.vertexSize = 0;
        for (let n = 0; n < map.length; n += 2)
            this.vertexSize += map[n + 1];
        let index = 0;
        for (let n = 0; n < map.length; n += 2) {
            vertexAttribute(map[n], map[n + 1], index);
            index += map[n + 1];
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

    drawMesh(mesh) {
        this.gl.bufferData(this.gl.ARRAY_BUFFER, mesh.data, this.gl.STATIC_DRAW);
        this.gl.drawArrays(mesh.triangle_strip ? this.gl.TRIANGLE_STRIP : this.gl.TRIANGLES,
            0, mesh.data.length / this.vertexSize);
    }
    setUniform(type, name, a, b, c){
        (this.gl['uniform' + type])(this.gl.getUniformLocation(this.gl.program, name), a, b, c);
    }
    drawObj(mesh, matrix, color){
        this.autodraw = false;
        let m = mxm(perspective(0, 0, -.5), matrix);
        setUniform('Matrix4fv', 'uMF', false, m);
        setUniform('Matrix4fv', 'uMI', false, inverse(m));
        setUniform('4fv', 'uC', color ?? [1, 1, 1, 1]);
        drawMesh(mesh);
    }
    addTexture(index, folder, src){
        let image = new Image();
        image.onload = () => {

            // MAKE THIS THE ACTIVE TEXTURE

            this.gl.activeTexture(this.gl.TEXTURE0 + index);

            // CREATE A NEW TEXTURE OBJECT

            this.gl.bindTexture(this.gl.TEXTURE_2D,
                this.gl.createTexture());

            // SPECIFY HOW SRC IMAGE WILL BE LAID OUT

            this.gl.texImage2D(this.gl.TEXTURE_2D,
                0,
                this.gl.RGBA,
                this.gl.RGBA,
                this.gl.UNSIGNED_BYTE,
                image);

            // SPECIFY HOW IT'S FILTERED WHEN MAGNIFIED

            this.gl.texParameteri(this.gl.TEXTURE_2D,
                this.gl.TEXTURE_MAG_FILTER,
                this.gl.LINEAR);

            // SPECIFY HOW IT'S FILTERED WHEN VERY SMALL

            this.gl.texParameteri(this.gl.TEXTURE_2D,
                this.gl.TEXTURE_MIN_FILTER,
                this.gl.LINEAR);

            // GENERATE THE MIP MAP PYRAMID

            this.gl.generateMipmap(this.gl.TEXTURE_2D);
        }

        // SPECIFY TEXTURE SRC TO BEGIN ACTUAL LOADING

        image.src = folder + src;
    }
}



// THIS IS A SIMPLE IMPLEMENTATION OF THE OPERATIONS NEEDED FOR MATRIX MANIPULATION.







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



