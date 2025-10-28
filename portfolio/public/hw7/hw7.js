/**
 * CODE FOR PERSPECTIVE TAKEN FROM: https://webglfundamentals.org/webgl/lessons/webgl-3d-perspective.html
 * CODE FOR CAMERA MOVEMENT TAKEN FROM: https://webglfundamentals.org/webgl/lessons/webgl-3d-camera.html
 * CODE FOR PARENTING TAKEN FROM: https://webglfundamentals.org/webgl/lessons/webgl-scene-graph.html
 * CODE FOR STRAFING, COMBO OF THESE TWO: https://stackoverflow.com/questions/66874183/unity3d-character-not-moving-in-the-direction-its-facing, https://www.3dgep.com/understanding-the-view-matrix/
 * @param {*} canvas 
 */

// DATA FOR THE BEZIER CURVED PATH


let BX = [5.962653, 5.557679, 5.246935, 4.427547, 4.231332, 3.957428, 3.700778, 3.527545, 2.949061, 2.187283, 1.916405, 0.431758, -0.459171, -1.832646, -4.725449, -3.327681, -2.846948, -0.641367, -0.755947, -0.837475, -1.91669, -4.749329, -5.148104, -6.942525, -7.325772, -8.516395, -10.69049, -6.991712, -6.800927, -3.715278, -3.1815, -3.085954, -0.984637, -1.092647, -1.501243, -2.122267, 0.861706, 1.323289, 2.506027, 3.017921, 3.41459, 6.010425, 6.522319, 6.918988, 8.566551, 8.976544, 9.431212, 9.190415, 9.14864, 9.072442, 5.703508, 5.962653];
let BY = [4.650385, 4.651405, 4.999056, 4.79332, 4.744053, 4.679785, 4.6434, 4.618841, 4.638083, 4.637498, 4.63729, 4.627297, 4.71326, 4.845782, 4.984596, 4.845493, 4.797651, 4.710769, 4.578196, 4.483863, 4.464466, 4.578196, 4.594206, 4.828518, 4.845493, 4.898227, 1.691512, 0.050903, -0.03372, 0.001233, 0.0, -0.000221, -0.008813, 0.0, 0.033339, -0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.50257, 0.951126, 1.448559, 2.107077, 2.608137, 3.522058, 4.483312, 4.650385];
let BZ = [-0.208223, -0.215029, 3.32467, 3.357878, 3.36583, 3.297317, 2.836778, 2.525923, 0.517979, -0.190809, -0.442844, -0.042246, -0.160965, -0.343984, 1.38826, 3.198316, 3.820846, 3.76988, 2.606519, 1.778734, -0.361032, 0.065689, 0.125763, 2.770259, 2.948208, 3.501038, 4.38697, 2.7666, 2.68302, -0.415637, -0.416465, -0.416613, -0.729298, 0.07372, 3.111483, 6.527402, 0.671975, -0.233784, 0.065533, 0.046633, 0.031986, 0.065533, 0.046633, 0.031986, -0.016189, -0.085838, -0.163076, -0.612176, -0.514291, -0.335753, -0.573871, -0.208223];
// const SNAKE2 = new Mesh(Parser.importMesh("./", "snake.ply"));
const SNAKE = {
   triangle_strip: false,
   data: new Float32Array([
      -0.5, 0.5, 0.5, -0.5773503, 0.5773503, 0.5773503, 0.625, 0,
      -0.5, -0.5, -0.5, -0.5773503, -0.5773503, -0.5773503, 0.375, 0.25,
      -0.5, -0.5, 0.5, -0.5773503, -0.5773503, 0.5773503, 0.375, 0,
      -0.5, 0.5, -0.5, -0.5773503, 0.5773503, -0.5773503, 0.625, 0.25,
      0.5, -0.5, -0.5, 0.5773503, -0.5773503, -0.5773503, 0.375, 0.5,
      0.5, 0.5, -0.5, 0.5773503, 0.5773503, -0.5773503, 0.625, 0.5,
      0.5, -0.5, 0.5, 0.5773503, -0.5773503, 0.5773503, 0.375, 0.75,
      0.5, 0.5, 0.5, 0.5773503, 0.5773503, 0.5773503, 0.625, 0.75,
      -0.5, -0.5, 0.5, -0.5773503, -0.5773503, 0.5773503, 0.375, 1,
      -0.5, -0.5, 0.5, -0.5773503, -0.5773503, 0.5773503, 0.125, 0.75,
      -0.5, -0.5, -0.5, -0.5773503, -0.5773503, -0.5773503, 0.125, 0.5,
      -0.5, 0.5, -0.5, -0.5773503, 0.5773503, -0.5773503, 0.875, 0.5,
      -0.5, 0.5, 0.5, -0.5773503, 0.5773503, 0.5773503, 0.625, 1,
      -0.5, 0.5, 0.5, -0.5773503, 0.5773503, 0.5773503, 0.875, 0.75,
      -0.425, 0.425, 1.3499999, -0.57735026, 0.5773503, 0.5773503, 0.625, 0,
      -0.425, -0.425, 0.5, -0.57735026, -0.5773503, -0.5773503, 0.375, 0.25,
      -0.425, -0.425, 1.3499999, -0.5773503, -0.57735026, 0.5773503, 0.375, 0,
      -0.425, 0.425, 0.5, -0.5773503, 0.57735026, -0.5773503, 0.625, 0.25,
      0.425, -0.425, 0.5, 0.5773503, -0.57735026, -0.5773503, 0.375, 0.5,
      0.425, 0.425, 0.5, 0.57735026, 0.5773503, -0.5773503, 0.625, 0.5,
      0.425, -0.425, 1.3499999, 0.57735026, -0.5773503, 0.5773503, 0.375, 0.75,
      0.425, 0.425, 1.3499999, 0.5773503, 0.57735026, 0.5773503, 0.625, 0.75,
      -0.425, -0.425, 1.3499999, -0.5773503, -0.57735026, 0.5773503, 0.375, 1,
      -0.425, -0.425, 1.3499999, -0.5773503, -0.57735026, 0.5773503, 0.125, 0.75,
      -0.425, -0.425, 0.5, -0.57735026, -0.5773503, -0.5773503, 0.125, 0.5,
      -0.425, 0.425, 0.5, -0.5773503, 0.57735026, -0.5773503, 0.875, 0.5,
      -0.425, 0.425, 1.3499999, -0.57735026, 0.5773503, 0.5773503, 0.625, 1,
      -0.425, 0.425, 1.3499999, -0.57735026, 0.5773503, 0.5773503, 0.875, 0.75,
      -0.36124998, 0.36125, 2.0724998, -0.57735026, 0.5773503, 0.5773503, 0.625, 0,
      -0.36124998, -0.36125, 1.3499999, -0.57735026, -0.5773503, -0.5773503, 0.375, 0.25,
      -0.36124998, -0.36125, 2.0724998, -0.5773504, -0.5773503, 0.57735026, 0.375, 0,
      -0.36124998, 0.36125, 1.3499999, -0.5773504, 0.5773503, -0.57735026, 0.625, 0.25,
      0.36125004, -0.36125, 1.3499999, 0.5773504, -0.5773503, -0.57735026, 0.375, 0.5,
      0.36125004, 0.36125, 1.3499999, 0.57735026, 0.5773503, -0.5773503, 0.625, 0.5,
      0.36125004, -0.36125, 2.0724998, 0.57735026, -0.5773503, 0.5773503, 0.375, 0.75,
      0.36125004, 0.36125, 2.0724998, 0.5773504, 0.5773503, 0.57735026, 0.625, 0.75,
      -0.36124998, -0.36125, 2.0724998, -0.5773504, -0.5773503, 0.57735026, 0.375, 1,
      -0.36124998, -0.36125, 2.0724998, -0.5773504, -0.5773503, 0.57735026, 0.125, 0.75,
      -0.36124998, -0.36125, 1.3499999, -0.57735026, -0.5773503, -0.5773503, 0.125, 0.5,
      -0.36124998, 0.36125, 1.3499999, -0.5773504, 0.5773503, -0.57735026, 0.875, 0.5,
      -0.36124998, 0.36125, 2.0724998, -0.57735026, 0.5773503, 0.5773503, 0.625, 1,
      -0.36124998, 0.36125, 2.0724998, -0.57735026, 0.5773503, 0.5773503, 0.875, 0.75,
      0.3070625, -0.3070625, 2.0724995, 0.5773503, -0.5773503, -0.5773504, 0.375, 0.5,
      -0.3070625, -0.3070625, 2.6866243, -0.5773503, -0.5773503, 0.5773504, 0.125, 0.75,
      -0.3070625, -0.3070625, 2.0724995, -0.5773503, -0.5773503, -0.5773504, 0.125, 0.5,
      -0.3070625, 0.3070625, 2.6866243, -0.5773503, 0.5773503, 0.5773504, 0.625, 0,
      -0.3070625, -0.3070625, 2.0724995, -0.5773503, -0.5773503, -0.5773504, 0.375, 0.25,
      -0.3070625, -0.3070625, 2.6866243, -0.5773503, -0.5773503, 0.5773504, 0.375, 0,
      0.3070625, 0.3070625, 2.6866243, 0.5773503, 0.5773503, 0.5773504, 0.625, 0.75,
      -0.3070625, -0.3070625, 2.6866243, -0.5773503, -0.5773503, 0.5773504, 0.375, 1,
      0.3070625, -0.3070625, 2.6866243, 0.5773503, -0.5773503, 0.5773504, 0.375, 0.75,
      0.3070625, 0.3070625, 2.0724995, 0.5773503, 0.5773503, -0.5773504, 0.625, 0.5,
      -0.3070625, 0.3070625, 2.0724995, -0.5773503, 0.5773503, -0.5773504, 0.875, 0.5,
      -0.3070625, 0.3070625, 2.0724995, -0.5773503, 0.5773503, -0.5773504, 0.625, 0.25,
      -0.3070625, 0.3070625, 2.6866243, -0.5773503, 0.5773503, 0.5773504, 0.625, 1,
      -0.3070625, 0.3070625, 2.6866243, -0.5773503, 0.5773503, 0.5773504, 0.875, 0.75,
      0.26100314, -0.26100314, 2.6866245, 0.5773503, -0.5773503, -0.5773503, 0.375, 0.5,
      -0.26100314, -0.26100314, 3.2086306, -0.5773503, -0.5773503, 0.5773503, 0.125, 0.75,
      -0.26100314, -0.26100314, 2.6866245, -0.57735026, -0.5773502, -0.5773502, 0.125, 0.5,
      -0.26100314, 0.26100314, 3.2086306, -0.57735026, 0.5773502, 0.5773502, 0.625, 0,
      -0.26100314, -0.26100314, 2.6866245, -0.57735026, -0.5773502, -0.5773502, 0.375, 0.25,
      -0.26100314, -0.26100314, 3.2086306, -0.5773503, -0.5773503, 0.5773503, 0.375, 0,
      0.26100314, 0.26100314, 3.2086306, 0.5773503, 0.5773503, 0.5773503, 0.625, 0.75,
      -0.26100314, -0.26100314, 3.2086306, -0.5773503, -0.5773503, 0.5773503, 0.375, 1,
      0.26100314, -0.26100314, 3.2086306, 0.57735026, -0.5773502, 0.5773502, 0.375, 0.75,
      0.26100314, 0.26100314, 2.6866245, 0.57735026, 0.5773502, -0.5773502, 0.625, 0.5,
      -0.26100314, 0.26100314, 2.6866245, -0.5773503, 0.5773503, -0.5773503, 0.875, 0.5,
      -0.26100314, 0.26100314, 2.6866245, -0.5773503, 0.5773503, -0.5773503, 0.625, 0.25,
      -0.26100314, 0.26100314, 3.2086306, -0.57735026, 0.5773502, 0.5773502, 0.625, 1,
      -0.26100314, 0.26100314, 3.2086306, -0.57735026, 0.5773502, 0.5773502, 0.875, 0.75,
      -0.5, 0.5, -0.5, -0.5773503, 0.5773503, 0.5773503, 0.625, 0,
      -0.5, -0.5, -1.5, -0.5773503, -0.5773503, -0.5773503, 0.375, 0.25,
      -0.5, -0.5, -0.5, -0.5773503, -0.5773503, 0.5773503, 0.375, 0,
      -0.5, 0.5, -1.5, -0.5773503, 0.5773503, -0.5773503, 0.625, 0.25,
      0.5, -0.5, -1.5, 0.5773503, -0.5773503, -0.5773503, 0.375, 0.5,
      0.5, 0.5, -1.5, 0.5773503, 0.5773503, -0.5773503, 0.625, 0.5,
      0.5, -0.5, -0.5, 0.5773503, -0.5773503, 0.5773503, 0.375, 0.75,
      0.5, 0.5, -0.5, 0.5773503, 0.5773503, 0.5773503, 0.625, 0.75,
      -0.5, -0.5, -0.5, -0.5773503, -0.5773503, 0.5773503, 0.375, 1,
      -0.5, -0.5, -0.5, -0.5773503, -0.5773503, 0.5773503, 0.125, 0.75,
      -0.5, -0.5, -1.5, -0.5773503, -0.5773503, -0.5773503, 0.125, 0.5,
      -0.5, 0.5, -1.5, -0.5773503, 0.5773503, -0.5773503, 0.875, 0.5,
      -0.5, 0.5, -0.5, -0.5773503, 0.5773503, 0.5773503, 0.625, 1,
      -0.5, 0.5, -0.5, -0.5773503, 0.5773503, 0.5773503, 0.875, 0.75,
      -0.5, 0.5, -1.5, -0.5773503, 0.5773503, 0.5773503, 0.625, 0,
      -0.5, -0.5, -2.5, -0.5773503, -0.5773503, -0.5773503, 0.375, 0.25,
      -0.5, -0.5, -1.5, -0.5773503, -0.5773503, 0.5773503, 0.375, 0,
      -0.5, 0.5, -2.5, -0.5773503, 0.5773503, -0.5773503, 0.625, 0.25,
      0.5, -0.5, -2.5, 0.5773503, -0.5773503, -0.5773503, 0.375, 0.5,
      0.5, 0.5, -2.5, 0.5773503, 0.5773503, -0.5773503, 0.625, 0.5,
      0.5, -0.5, -1.5, 0.5773503, -0.5773503, 0.5773503, 0.375, 0.75,
      0.5, 0.5, -1.5, 0.5773503, 0.5773503, 0.5773503, 0.625, 0.75,
      -0.5, -0.5, -1.5, -0.5773503, -0.5773503, 0.5773503, 0.375, 1,
      -0.5, -0.5, -1.5, -0.5773503, -0.5773503, 0.5773503, 0.125, 0.75,
      -0.5, -0.5, -2.5, -0.5773503, -0.5773503, -0.5773503, 0.125, 0.5,
      -0.5, 0.5, -2.5, -0.5773503, 0.5773503, -0.5773503, 0.875, 0.5,
      -0.5, 0.5, -1.5, -0.5773503, 0.5773503, 0.5773503, 0.625, 1,
      -0.5, 0.5, -1.5, -0.5773503, 0.5773503, 0.5773503, 0.875, 0.75,
      -0.5, 0.5, -2.5, -0.5773503, 0.5773503, 0.5773503, 0.625, 0,
      -0.5, -0.5, -3.5, -0.5773503, -0.5773503, -0.5773503, 0.375, 0.25,
      -0.5, -0.5, -2.5, -0.5773503, -0.5773503, 0.5773503, 0.375, 0,
      -0.5, 0.5, -3.5, -0.5773503, 0.5773503, -0.5773503, 0.625, 0.25,
      0.5, -0.5, -3.5, 0.5773503, -0.5773503, -0.5773503, 0.375, 0.5,
      0.5, 0.5, -3.5, 0.5773503, 0.5773503, -0.5773503, 0.625, 0.5,
      0.5, -0.5, -2.5, 0.5773503, -0.5773503, 0.5773503, 0.375, 0.75,
      0.5, 0.5, -2.5, 0.5773503, 0.5773503, 0.5773503, 0.625, 0.75,
      -0.5, -0.5, -2.5, -0.5773503, -0.5773503, 0.5773503, 0.375, 1,
      -0.5, -0.5, -2.5, -0.5773503, -0.5773503, 0.5773503, 0.125, 0.75,
      -0.5, -0.5, -3.5, -0.5773503, -0.5773503, -0.5773503, 0.125, 0.5,
      -0.5, 0.5, -3.5, -0.5773503, 0.5773503, -0.5773503, 0.875, 0.5,
      -0.5, 0.5, -2.5, -0.5773503, 0.5773503, 0.5773503, 0.625, 1,
      -0.5, 0.5, -2.5, -0.5773503, 0.5773503, 0.5773503, 0.875, 0.75,
      -0.5, 0.5, -3.5, -0.5773503, 0.5773503, 0.5773503, 0.625, 0,
      -0.5, -0.5, -4.5, -0.5773503, -0.5773503, -0.5773503, 0.375, 0.25,
      -0.5, -0.5, -3.5, -0.5773503, -0.5773503, 0.5773503, 0.375, 0,
      -0.5, 0.5, -4.5, -0.5773503, 0.5773503, -0.5773503, 0.625, 0.25,
      0.5, -0.5, -4.5, 0.5773503, -0.5773503, -0.5773503, 0.375, 0.5,
      0.5, 0.5, -4.5, 0.5773503, 0.5773503, -0.5773503, 0.625, 0.5,
      0.5, -0.5, -3.5, 0.5773503, -0.5773503, 0.5773503, 0.375, 0.75,
      0.5, 0.5, -3.5, 0.5773503, 0.5773503, 0.5773503, 0.625, 0.75,
      -0.5, -0.5, -3.5, -0.5773503, -0.5773503, 0.5773503, 0.375, 1,
      -0.5, -0.5, -3.5, -0.5773503, -0.5773503, 0.5773503, 0.125, 0.75,
      -0.5, -0.5, -4.5, -0.5773503, -0.5773503, -0.5773503, 0.125, 0.5,
      -0.5, 0.5, -4.5, -0.5773503, 0.5773503, -0.5773503, 0.875, 0.5,
      -0.5, 0.5, -3.5, -0.5773503, 0.5773503, 0.5773503, 0.625, 1,
      -0.5, 0.5, -3.5, -0.5773503, 0.5773503, 0.5773503, 0.875, 0.75,
      -0.5, 0.5, -4.5, -0.5773503, 0.5773503, 0.5773503, 0.625, 0,
      -0.5, -0.5, -5.5, -0.5773503, -0.5773503, -0.5773503, 0.375, 0.25,
      -0.5, -0.5, -4.5, -0.5773503, -0.5773503, 0.5773503, 0.375, 0,
      -0.5, 0.5, -5.5, -0.5773503, 0.5773503, -0.5773503, 0.625, 0.25,
      0.5, -0.5, -5.5, 0.5773503, -0.5773503, -0.5773503, 0.375, 0.5,
      0.5, 0.5, -5.5, 0.5773503, 0.5773503, -0.5773503, 0.625, 0.5,
      0.5, -0.5, -4.5, 0.5773503, -0.5773503, 0.5773503, 0.375, 0.75,
      0.5, 0.5, -4.5, 0.5773503, 0.5773503, 0.5773503, 0.625, 0.75,
      -0.5, -0.5, -4.5, -0.5773503, -0.5773503, 0.5773503, 0.375, 1,
      -0.5, -0.5, -4.5, -0.5773503, -0.5773503, 0.5773503, 0.125, 0.75,
      -0.5, -0.5, -5.5, -0.5773503, -0.5773503, -0.5773503, 0.125, 0.5,
      -0.5, 0.5, -5.5, -0.5773503, 0.5773503, -0.5773503, 0.875, 0.5,
      -0.5, 0.5, -4.5, -0.5773503, 0.5773503, 0.5773503, 0.625, 1,
      -0.5, 0.5, -4.5, -0.5773503, 0.5773503, 0.5773503, 0.875, 0.75,
      -0.5, 0.5, -5.5, -0.5773503, 0.5773503, 0.5773503, 0.625, 0,
      -0.5, -0.5, -6.5, -0.5773503, -0.5773503, -0.5773503, 0.375, 0.25,
      -0.5, -0.5, -5.5, -0.5773503, -0.5773503, 0.5773503, 0.375, 0,
      -0.5, 0.5, -6.5, -0.5773503, 0.5773503, -0.5773503, 0.625, 0.25,
      0.5, -0.5, -6.5, 0.5773503, -0.5773503, -0.5773503, 0.375, 0.5,
      0.5, 0.5, -6.5, 0.5773503, 0.5773503, -0.5773503, 0.625, 0.5,
      0.5, -0.5, -5.5, 0.5773503, -0.5773503, 0.5773503, 0.375, 0.75,
      0.5, 0.5, -5.5, 0.5773503, 0.5773503, 0.5773503, 0.625, 0.75,
      -0.5, -0.5, -5.5, -0.5773503, -0.5773503, 0.5773503, 0.375, 1,
      -0.5, -0.5, -5.5, -0.5773503, -0.5773503, 0.5773503, 0.125, 0.75,
      -0.5, -0.5, -6.5, -0.5773503, -0.5773503, -0.5773503, 0.125, 0.5,
      -0.5, 0.5, -6.5, -0.5773503, 0.5773503, -0.5773503, 0.875, 0.5,
      -0.5, 0.5, -5.5, -0.5773503, 0.5773503, 0.5773503, 0.625, 1,
      -0.5, 0.5, -5.5, -0.5773503, 0.5773503, 0.5773503, 0.875, 0.75,
      -0.625, 0.5625, -6.5, -0.57735026, 0.5773503, 0.5773503, 0.625, 0,
      -0.625, -0.5625, -8, -0.57735026, -0.5773503, -0.5773503, 0.375, 0.25,
      -0.625, -0.5625, -6.5, -0.5773503, -0.5773503, 0.5773503, 0.375, 0,
      -0.625, 0.5625, -8, -0.5773503, 0.5773503, -0.5773503, 0.625, 0.25,
      0.625, -0.5625, -8, 0.5773503, -0.5773503, -0.5773503, 0.375, 0.5,
      0.625, 0.5625, -8, 0.57735026, 0.5773503, -0.5773503, 0.625, 0.5,
      0.625, -0.5625, -6.5, 0.57735026, -0.5773503, 0.5773503, 0.375, 0.75,
      0.625, 0.5625, -6.5, 0.5773503, 0.5773503, 0.5773503, 0.625, 0.75,
      -0.625, -0.5625, -6.5, -0.5773503, -0.5773503, 0.5773503, 0.375, 1,
      -0.625, -0.5625, -6.5, -0.5773503, -0.5773503, 0.5773503, 0.125, 0.75,
      -0.625, -0.5625, -8, -0.57735026, -0.5773503, -0.5773503, 0.125, 0.5,
      -0.625, 0.5625, -8, -0.5773503, 0.5773503, -0.5773503, 0.875, 0.5,
      -0.625, 0.5625, -6.5, -0.57735026, 0.5773503, 0.5773503, 0.625, 1,
      -0.625, 0.5625, -6.5, -0.57735026, 0.5773503, 0.5773503, 0.875, 0.75,
      0.20163268, 0.3885306, -8, -0.57735026, 0.5773503, 0.5773503, 0.625, 0,
      0.20163268, 0.21146941, -8.236082, -0.57735026, -0.5773503, -0.5773503, 0.375, 0.25,
      0.20163268, 0.21146941, -8, -0.5773503, -0.5773503, 0.5773503, 0.375, 0,
      0.20163268, 0.3885306, -8.236082, -0.5773503, 0.5773503, -0.5773503, 0.625, 0.25,
      0.39836735, 0.21146941, -8.236082, 0.5773503, -0.5773503, -0.5773503, 0.375, 0.5,
      0.39836735, 0.3885306, -8.236082, 0.57735026, 0.5773503, -0.5773503, 0.625, 0.5,
      0.39836735, 0.21146941, -8, 0.57735026, -0.5773503, 0.5773503, 0.375, 0.75,
      0.39836735, 0.3885306, -8, 0.5773503, 0.5773503, 0.5773503, 0.625, 0.75,
      0.20163268, 0.21146941, -8, -0.5773503, -0.5773503, 0.5773503, 0.375, 1,
      0.20163268, 0.21146941, -8, -0.5773503, -0.5773503, 0.5773503, 0.125, 0.75,
      0.20163268, 0.21146941, -8.236082, -0.57735026, -0.5773503, -0.5773503, 0.125, 0.5,
      0.20163268, 0.3885306, -8.236082, -0.5773503, 0.5773503, -0.5773503, 0.875, 0.5,
      0.20163268, 0.3885306, -8, -0.57735026, 0.5773503, 0.5773503, 0.625, 1,
      0.20163268, 0.3885306, -8, -0.57735026, 0.5773503, 0.5773503, 0.875, 0.75,
      -0.39836735, 0.3885306, -8, -0.57735026, 0.5773503, 0.5773503, 0.625, 0,
      -0.39836735, 0.21146941, -8.236082, -0.57735026, -0.5773503, -0.5773503, 0.375, 0.25,
      -0.39836735, 0.21146941, -8, -0.5773503, -0.5773503, 0.5773503, 0.375, 0,
      -0.39836735, 0.3885306, -8.236082, -0.5773503, 0.5773503, -0.5773503, 0.625, 0.25,
      -0.20163268, 0.21146941, -8.236082, 0.5773503, -0.5773503, -0.5773503, 0.375, 0.5,
      -0.20163268, 0.3885306, -8.236082, 0.57735026, 0.5773503, -0.5773503, 0.625, 0.5,
      -0.20163268, 0.21146941, -8, 0.57735026, -0.5773503, 0.5773503, 0.375, 0.75,
      -0.20163268, 0.3885306, -8, 0.5773503, 0.5773503, 0.5773503, 0.625, 0.75,
      -0.39836735, 0.21146941, -8, -0.5773503, -0.5773503, 0.5773503, 0.375, 1,
      -0.39836735, 0.21146941, -8, -0.5773503, -0.5773503, 0.5773503, 0.125, 0.75,
      -0.39836735, 0.21146941, -8.236082, -0.57735026, -0.5773503, -0.5773503, 0.125, 0.5,
      -0.39836735, 0.3885306, -8.236082, -0.5773503, 0.5773503, -0.5773503, 0.875, 0.5,
      -0.39836735, 0.3885306, -8, -0.57735026, 0.5773503, 0.5773503, 0.625, 1,
      -0.39836735, 0.3885306, -8, -0.57735026, 0.5773503, 0.5773503, 0.875, 0.75,
   ])
};
function Scene(canvas) {
   let evalBezier = (t, BX, BY, BZ, getF = false) => {
      let nk = (BX.length - 1) / 3;

      // MATH TO EVALUATE A POINT ALONG A BEZIER SPLINE

      let M = [[-1, 3, -3, 1], [3, -6, 3, 0], [-3, 3, 0, 0], [1, 0, 0, 0]];
      let T = (a, t) => a[0] * t * t * t + a[1] * t * t + a[2] * t + a[3];
      let Vi = (V, i, t) => V[i] * T(M[i], t);
      let C = (V, t) => Vi(V, 0, t) + Vi(V, 1, t) + Vi(V, 2, t) + Vi(V, 3, t);

      // FIND THE SPLINE SEGMENT AND POSITION IN THE SEGMENT

      let n = nk * t - .001 >> 0;
      let f = nk * t - n;

      // EVAL AND RETURN THE X AND Y COORDINATES OF THE POINT
      if (getF) {
         return [C(BX.slice(3 * n), f), C(BY.slice(3 * n), f), C(BZ.slice(3 * n), f), f];
      }
      return [C(BX.slice(3 * n), f), C(BY.slice(3 * n), f), C(BZ.slice(3 * n), f)];
   }

   let parametric = (f, nu, nv, other) => {
      let V = [];
      for (let j = 0; j < nv; j++) {
         for (let i = 0; i <= nu; i++) {
            V.push(f(i / nu, j / nv, other));
            V.push(f(i / nu, (j + 1) / nv, other));
         }
         V.push(f(1, (j + 1) / nv, other));
         V.push(f(0, (j + 1) / nv, other));
      }
      return V.flat();
   }

   let wire = (nu, nv, B) => parametric(drawCurve, nu, nv, B);

   let drawCurve = (u, v, B) => {
      let BX = B[0], BY = B[1], BZ = B[2], r = B[3];
      let t = u;
      let nk = (BX.length - 1) / 3;

      // MATH TO EVALUATE A POINT ALONG A BEZIER SPLINE

      let M = [[-1, 3, -3, 1], [3, -6, 3, 0], [-3, 3, 0, 0], [1, 0, 0, 0]];
      let T = (a, t) => a[0] * t * t * t + a[1] * t * t + a[2] * t + a[3];
      let Vi = (V, i, t) => V[i] * T(M[i], t);
      let C = (V, t) => Vi(V, 0, t) + Vi(V, 1, t) + Vi(V, 2, t) + Vi(V, 3, t);

      // FIND THE SPLINE SEGMENT AND POSITION IN THE SEGMENT

      let n = nk * t - .001 >> 0;
      let f = nk * t - n;

      // FIND THE POINT ON THE SPLINE PATH

      let x = C(BX.slice(3 * n), f);
      let y = C(BY.slice(3 * n), f);
      let z = C(BZ.slice(3 * n), f);

      // FIND FIRST AND SECOND DERIVATIVES ON THE CURVE

      let P1_P0 = [BX[3 * n + 1] - BX[3 * n], BY[3 * n + 1] - BY[3 * n], BZ[3 * n + 1] - BZ[3 * n]];
      let P2_P1 = [BX[3 * n + 2] - BX[3 * n + 1], BY[3 * n + 2] - BY[3 * n + 1], BZ[3 * n + 2] - BZ[3 * n + 1]];
      let P3_P2 = [BX[3 * n + 3] - BX[3 * n + 2], BY[3 * n + 3] - BY[3 * n + 2], BZ[3 * n + 3] - BZ[3 * n + 2]];

      let P2_2P1_P0 = [BX[3 * n + 2] - 2 * BX[3 * n + 1] + BX[3 * n], BY[3 * n + 2] - 2 * BY[3 * n + 1] + BY[3 * n], BZ[3 * n + 2] - 2 * BZ[3 * n + 1] + BZ[3 * n]];
      let P3_2P2_P1 = [BX[3 * n + 3] - 2 * BX[3 * n + 2] + BX[3 * n + 1], BY[3 * n + 3] - 2 * BY[3 * n + 2] + BY[3 * n + 1], BZ[3 * n + 3] - 2 * BZ[3 * n + 2] + BZ[3 * n + 1]];

      const f_vals = [3 * (1 - f) ** 2, 6 * (1 - f) * f, 3 * f ** 2];
      let F_grad = normalize([f_vals[0] * P1_P0[0] + f_vals[1] * P2_P1[0] + f_vals[2] * P3_P2[0], f_vals[0] * P1_P0[1] + f_vals[1] * P2_P1[1] + f_vals[2] * P3_P2[1], f_vals[0] * P1_P0[2] + f_vals[1] * P2_P1[2] + f_vals[2] * P3_P2[2]]);
      const s_vals = [6 * (1 - f), 6 * f];
      let S_grad = normalize([s_vals[0] * P2_2P1_P0[0] + s_vals[1] * P3_2P2_P1[0], s_vals[0] * P2_2P1_P0[1] + s_vals[1] * P3_2P2_P1[1], s_vals[0] * P2_2P1_P0[2] + s_vals[1] * P3_2P2_P1[2]]);

      // FIND THE NORMAL AND BINORMAL VECTORS ON THE CURVE
      let BIN = normalize(cross(F_grad, S_grad));
      let N = normalize(cross(BIN, F_grad));

      let c = Math.cos(2 * Math.PI * v);
      let s = Math.sin(2 * Math.PI * v);

      N = [N[0] * c + BIN[0] * s, N[1] * c + BIN[1] * s, N[2] * c + BIN[2] * s];

      let P = [x + r * N[0], y + r * N[1], z + r * N[2]];

      // RETURN POINT AND NORMAL

      return [P[0], P[2], P[1], N[0], N[1], N[2]];
   }

   this.LEFT = false;
   this.RIGHT = false;
   this.UP = false;
   this.DOWN = false;
   this.SPIN = true;
   this.SPIRAL = false;
   this.CUBES_X = 0;
   function rgb(r, g, b, a) {
      return [r / 255, g / 255, b / 255, a];
   }

   let C0 = new Cube();
   C0.scale(0.1, 0.02, 0.3);
   C0.move(0, -0.08, 0);
   C0.COLOR = rgb(0, 30, 255, 1);
   // C0.animate = (t) => {
   //    let p = evalBezier(t / 20 % 1, BX, BY, BZ);
   //    C0.setPosition(p[0], p[2], p[1]);
   // }

   let C1 = new Cube();
   this.canvas = canvas;

   C1.scale(0.3, 0.3, 0.3);
   C1.move(0, 0, 0);
   C1.animate = (t) => {
      C1.clearRotation();
      C1.turnY(t - startTime);
      C1.turnX(t - startTime);
   }
   C1.COLOR = rgb(255, 0, 0, 1);


   // let C2 = new Cube();
   // C2.scale(0.3, 0.3, 0.3);
   // C2.move(0, 0, -3);
   // C2.COLOR = rgb(0, 0, 255, 1);

   // C2.animate = (t) => {
   //    let delta = t - prev;
   //    C2.move(0, 0, -0.5 * delta);
   // }

   const SNAKE2 = new Mesh(Parser.importMesh("./", "snake2.ply"));
   // SNAKE2.scale(1000,1000,1000);
   SNAKE2.COLOR = rgb(0,255,0,1);
   SNAKE2.setPosition(0,0,0);
   this.meshes = [C0, SNAKE2];


   mesh = {
      triangle_strip: true,
      data: new Float32Array(wire(100, 10, [BX, BY, BZ, 0.05])),
   };

   function createGround() {
      let GROUND = new Cube();
      GROUND.scale(10, 0.1, 10);
      GROUND.move(0, -0.55, 0);
      GROUND.COLOR = rgb(102, 255, 102, 1);
      return GROUND;
   }

   function createRoom() {
      let LEFT_WALL = new Cube();
      LEFT_WALL.scale(0.1, 1, 10);
      LEFT_WALL.applyAll();
      LEFT_WALL.move(-100, 0.5, 0);

      LEFT_WALL.COLOR = rgb(24, 59, 46, 1);

      let RIGHT_WALL = new Cube();
      RIGHT_WALL.scale(0.1, 1, 10);
      RIGHT_WALL.applyAll();
      RIGHT_WALL.move(100, 0.5, 0);
      RIGHT_WALL.COLOR = rgb(39, 105, 78, 1);

      let BACK_WALL = new Cube();
      BACK_WALL.scale(10, 1, 0.1);
      BACK_WALL.applyAll();
      BACK_WALL.move(0, 0.5, -100);
      BACK_WALL.COLOR = rgb(76, 152, 118, 1);

      let FRONT_WALL = new Cube();
      FRONT_WALL.scale(10, 1, 0.1);
      FRONT_WALL.applyAll();
      FRONT_WALL.move(0, 0.5, 100);
      FRONT_WALL.COLOR = rgb(144, 199, 164, 1);

      let ROOF = new Cube();
      ROOF.scale(10, 0.1, 10);
      ROOF.applyAll();
      ROOF.move(0, 16, 0);
      ROOF.COLOR = rgb(24, 59, 46, 1);



      return [LEFT_WALL, RIGHT_WALL, BACK_WALL, FRONT_WALL, ROOF];
   }

   function createTrees() {
      let TREES = [];
      for (let i = 0; i < 5; i++) {
         let TREE = new Mesh();
         let TRUNK = new Cube();
         TRUNK.scale(0.2, 1, 0.2);
         TRUNK.applyAll();
         TRUNK.move(0, 0.5, 0);
         TRUNK.COLOR = rgb(102, 51, 0, 1);
         TRUNK.setParent(TREE);
         let LEAVES = new Cube();
         LEAVES.scale(0.7, 0.7, 0.7);
         LEAVES.applyAll();
         LEAVES.move(0, 1.5, 0);
         LEAVES.COLOR = rgb(0, 153 + (Math.random() * 10 - 20), 0, 1);
         LEAVES.setParent(TREE);
         TREE.move(- 8, -0.2, Math.random() * 16 - 8);
         TREE.turnY(Math.random() * 0.4 - 0.2);
         TREES = TREES.concat([TRUNK, LEAVES]);
      }

      for (let i = 0; i < 5; i++) {
         let TREE = new Mesh();
         let TRUNK = new Cube();
         TRUNK.scale(0.2, 1, 0.2);
         TRUNK.applyAll();
         TRUNK.move(0, 0.5, 0);
         TRUNK.COLOR = rgb(102, 51, 0, 1);
         TRUNK.setParent(TREE);
         let LEAVES = new Cube();
         LEAVES.scale(0.7, 0.7, 0.7);
         LEAVES.applyAll();
         LEAVES.move(0, 1.5, 0);
         LEAVES.COLOR = rgb(0, 153 + (Math.random() * 10 - 20), 0, 1);
         LEAVES.setParent(TREE);
         TREE.move(10, -0.2, Math.random() * 16 - 8);
         TREE.turnY(Math.random() * 0.4 - 0.2);
         TREES = TREES.concat([TRUNK, LEAVES]);
      }

      for (let i = 0; i < 5; i++) {
         let TREE = new Mesh();
         let TRUNK = new Cube();
         TRUNK.scale(0.2, 1, 0.2);
         TRUNK.applyAll();
         TRUNK.move(0, 0.5, 0);
         TRUNK.COLOR = rgb(102, 51, 0, 1);
         TRUNK.setParent(TREE);
         let LEAVES = new Cube();
         LEAVES.scale(0.7, 0.7, 0.7);
         LEAVES.applyAll();
         LEAVES.move(0, 1.5, 0);
         LEAVES.COLOR = rgb(0, 153 + (Math.random() * 10 - 20), 0, 1);
         LEAVES.setParent(TREE);
         TREE.move(Math.random() * 16 - 8, -0.2, 8);
         TREE.turnY(Math.random() * 0.4 - 0.2);
         TREES = TREES.concat([TRUNK, LEAVES]);
      }

      for (let i = 0; i < 5; i++) {
         let TREE = new Mesh();
         let TRUNK = new Cube();
         TRUNK.scale(0.2, 1, 0.2);
         TRUNK.applyAll();
         TRUNK.move(0, 0.5, 0);
         TRUNK.COLOR = rgb(102, 51, 0, 1);
         TRUNK.setParent(TREE);
         let LEAVES = new Cube();
         LEAVES.scale(0.7, 0.7, 0.7);
         LEAVES.applyAll();
         LEAVES.move(0, 1.5, 0);
         LEAVES.COLOR = rgb(0, 153 + (Math.random() * 10 - 20), 0, 1);
         LEAVES.setParent(TREE);
         TREE.move(Math.random() * 16 - 8, -0.2, -8);
         TREE.turnY(Math.random() * 0.4 - 0.2);
         TREES = TREES.concat([TRUNK, LEAVES]);
      }
      return TREES
   }

   function createArms() {
      let LEFT_ARM = new Cube();
      LEFT_ARM.scale(0.01, 0.01, 0.1);
      LEFT_ARM.applyAll();
      LEFT_ARM.move(-3, -5.2, -1.8);
      LEFT_ARM.COLOR = rgb(255, 255, 255, 1);

      let RIGHT_ARM = new Cube();
      RIGHT_ARM.scale(0.01, 0.01, 0.1);
      RIGHT_ARM.applyAll();
      RIGHT_ARM.move(3, -5.2, -1.8);
      RIGHT_ARM.COLOR = rgb(255, 255, 255, 1);
      return [LEFT_ARM, RIGHT_ARM];
   }


   this.createSpiral = () => {
      const Cubes = new Array(8);
      this.CENTER = new Mesh();
      this.CENTER.applyAll();
      for (let i = 0; i < Cubes.length; i++) {
         Cubes[i] = new Cube();
         Cubes[i].scale(0.05, 0.05, 0.05);
         Cubes[i].COLOR = rgb(145, 224, 244, 10);
         Cubes[i].applyAll();

         Cubes[i].setParent(this.CENTER);
      }
      this.CENTER.move(0, 0, -0.5);
      return Cubes;
   }


   this.GROUND = createGround();
   this.meshes = this.meshes.concat(this.GROUND);
   const ARMS = createArms();
   this.meshes = this.meshes.concat(ARMS);

   this.meshes = this.meshes.concat(createTrees());


   const WALLS = createRoom();

   let ROOM = new Mesh();
   ROOM.applyAll();
   for (let i = 0; i < WALLS.length; i++) {
      WALLS[i].setParent(ROOM);
   }
   this.GROUND.setParent(ROOM);

   ROOM.animate = (t) => {
      if (!this.SPIN) {
         return;
      }
      let delta = t - prev;
      ROOM.turnY(delta);
   }
   // this.meshes = this.meshes.concat(WALLS);
   // this.meshes.push(ROOM);

   this.CUBES = this.meshes.length;
   this.meshes = this.meshes.concat(this.createSpiral());

   this.P = new Matrix()

   this.vertexShader = `\
#version 300 es
uniform mat4 uMF, uMI, uMP, uMV;
in  vec3 aPos, aNor;
out vec3 vPos, vNor;
void main() {
   vec4 pos = uMF * vec4(aPos, 1.);
   vec4 nor = vec4(aNor, 0.) * uMI;
   gl_Position = uMP * uMV * pos;
   vPos = pos.xyz;
   vNor = nor.xyz;
}`;

   this.fragmentShader = `\
#version 300 es
precision highp float;
uniform vec4 uC;
uniform float uTime;
in  vec3 vPos, vNor;
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

void main() {

   // //First color the background
   // float t = 0.5 + 0.5 * vPos.y;
   // if (t > .5)
   //    t += .3 * turbulence(vPos + vec3(.05*uTime,0.,.1*uTime));
   // vec3 c = vec3(0.8,1.,1.);
   // c = mix(c, vec3(0.1,0.,0.0), min(t,.5));
   // if (t > 0.65)
   //    c = mix(c, vec3(.2,.1,0.0), (t-.65) / (.7 - .65));
   // fragColor = vec4(sqrt(c), 1.);
   vec3 nor = normalize(vNor);
   float c_s = .5 + max(0., dot(vec3(1.0),nor));
   fragColor = uC * vec4(c_s,c_s,c_s, 1.);
}`;

   let startTime = Date.now() / 1000;
   let prev = startTime;
   autodraw = false;

   function persp(fieldOfViewInRadians, aspect, near, far) {
      let f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewInRadians);
      let rangeInv = 1.0 / (near - far);
      return new Matrix([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (near + far) * rangeInv, -1, 0, 0, near * far * rangeInv * 2, 0]);
   }

   this.initialize = () => {
      // let data;
      Parser.importMesh("./", "snake.ply").then (data => {
         SNAKE.data = data;
      })
      // const data = Parser.importMesh("./", "snake.ply");
      // SNAKE.data = data;
      let P = persp(Math.PI / 4, this.canvas.width / this.canvas.height, 0.1, 100);
      setUniform('Matrix4fv', 'uMP', false, P.m);

      this.C = new Mesh();
      this.C.bake();
      ARMS.forEach(arm => {
         arm.setParent(this.C);
      });
      this.CENTER.setParent(this.C);
      C0.setParent(this.C);

      this.C.move(0, 0, 3);
      // curve.setParent(this.C);

      // drawMesh(mesh);

      setUniform('Matrix4fv', 'uMV', false, this.C.QI.m);
      // const I4 = new Matrix().m; // identity 4x4

      // // then right before drawMesh(mesh)
      // setUniform('Matrix4fv', 'uMF', false, I4);
      // setUniform('Matrix4fv', 'uMI', false, I4);
      // setUniform('4fv', 'uC', [1, 1, 1, 1]); // optional color
      // drawMesh(mesh);
   }

   this.events = [['keyup', (evt) => {
      if (evt.key === 'ArrowLeft' || evt.key === 'a') {
         this.LEFT = false;
      } else if (evt.key === 'ArrowRight' || evt.key === 'd') {
         this.RIGHT = false;
      }
      if (evt.key === 'ArrowUp' || evt.key === 'w') {
         this.UP = false;
      } else if (evt.key === 'ArrowDown' || evt.key === 's') {
         this.DOWN = false;
      }

      // if (evt.key === 'Space'){
      //    this.RISE = true;
      // }else if (evt.key === 'x'){
      //    this.RISE = false;
      // }
   }, false], ['keydown', (evt) => {

      //If moving left or right, move by delta
      if (evt.key === 'ArrowLeft' || evt.key === 'a') {
         this.LEFT = true;
      } else if (evt.key === 'ArrowRight' || evt.key === 'd') {
         this.RIGHT = true;
      }

      //If moving left or right, move by delta
      if (evt.key === 'ArrowUp' || evt.key === 'w') {
         this.UP = true;
      } else if (evt.key === 'ArrowDown' || evt.key === 's') {
         this.DOWN = true;
      }

      if (evt.key === 'r') {
         this.SPIN = !this.SPIN;
      }

   }, false], ['mousemove', (evt) => {
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
         this.C.clearRotation();
         this.C.turnY(coord * Math.PI);
         this.updateCam();
      }
   }], ['click', (evt) => {
      this.SPIRAL = true;
   }]];

   this.update = () => {
      let time = Date.now() / 1000;
      this.updateMovement(time);
      if (this.SPIRAL && this.CUBES) {
         this.animateSpiral(time);
      } else {
         this.initializeCubes();
      }
      this.reloadShapes();
      setUniform('1f', 'uTime', time);
      prev = time;
   }
   const SPIRAL_N = this.meshes.length - this.CUBES;
   //Travel each cube along a spiral rotate by 2PI/ i degrees
   this.theta_prev = new Array(SPIRAL_N);
   for (let i = 0; i < SPIRAL_N; i++) {
      this.theta_prev[i] = Math.PI * 2 * i / SPIRAL_N;
   }
   this.animateSpiral = (time) => {
      let delta = time - prev;
      let V = { x: 2, y: 2, z: -20 };


      let r = 5;

      for (let i = 0; i < SPIRAL_N; i++) {
         let new_theta = this.theta_prev[i] + V.x * delta;
         const d = { x: r * Math.sin(new_theta) - r * Math.sin(this.theta_prev[i]), y: V.y * delta * (i + 1) / 10, z: r * Math.cos(new_theta) - r * Math.cos(this.theta_prev[i]) + V.z * delta };
         this.meshes[i + this.CUBES].move(d.x, d.y, d.z);
         this.meshes[i + this.CUBES].turnY(d.z);
         this.meshes[i + this.CUBES].turnX(d.x);
         if (this.meshes[i + this.CUBES].getPosition().y >= 15) {
            this.resetCubes();
            return;
         } else {
            this.theta_prev[i] = new_theta;
         }
      }
   }
   this.initializeCubes = () => {
      for (let i = this.CUBES; i < this.meshes.length; i++) {
         this.meshes[i].setPosition(this.CUBES_X, 0, 0);
         this.meshes[i].clearRotation();
      }
   }

   this.resetCubes = () => {
      this.SPIRAL = false;
      for (let i = 0; i < SPIRAL_N; i++) {
         this.theta_prev[i] = Math.PI * 2 * i / SPIRAL_N;
         const pos = this.meshes[i + this.CUBES].getPosition();
         this.meshes[i + this.CUBES].move(-pos.x, -pos.y, -pos.z);
      }
   }

   this.updateCam = () => {
      setUniform('Matrix4fv', 'uMV', false, this.C.QI.m);
   }

   this.updateMovement = (time) => {
      if (this.C) {
         let delta = time - prev;
         const V = { x: 4, y: 4, z: 4 };
         let x = 0;
         let y = 0;

         if (this.LEFT) {
            x = -V.x;
         } else if (this.RIGHT) {
            x = V.x;
         }


         if (this.UP) {
            y = V.y;
         } else if (this.DOWN) {
            y = -V.y;
         }
         y *= delta;
         x *= delta;

         if (x != 0 && y != 0) {
            y /= 2;
            x /= 2;
         }

         // let p = evalBezier(time / 20 % 1, BX, BY, BZ);
         // this.C.setPosition(p[0], p[2] + 0.25, p[1]);
         this.C.move(x * this.C.Q.m[0] + -this.C.Q.m[8] * y, 0, -y * this.C.Q.m[10] + x * this.C.Q.m[2]);

         this.updateCam();

      }
   }

   this.drawSnake = () => {
      // Parser.importMesh("./", "snake.ply")
      let M = new Matrix().identity().m;
      setUniform('Matrix4fv', 'uMF', false, M);
      setUniform('Matrix4fv', 'uMI', false, inverse(M));
      setUniform('4fv', 'uC', [1.0, 1.0, 1.0, 1.0]);
      drawMesh(SNAKE);
   }

   this.reloadShapes = () => {
      const N = this.SPIRAL ? this.meshes.length : this.CUBES;
      this.drawSnake();
      for (let i = 0; i < N; i++) {
         let mesh = this.meshes[i];
         if (mesh.animate) {
            mesh.animate(Date.now() / 1000);
         }
         let M = mesh.getWorldMatrix();
         setUniform('Matrix4fv', 'uMF', false, M);
         setUniform('Matrix4fv', 'uMI', false, inverse(M));
         setUniform('4fv', 'uC', mesh.COLOR);
         drawMesh(mesh.mesh);
      }

      let m = move(0, 0, 0)
      setUniform('Matrix4fv', 'uMF', false, m);
      setUniform('Matrix4fv', 'uMI', false, inverse(m));
      setUniform('4fv', 'uC', rgb(160, 160, 160, 1));
      drawMesh(mesh);
   }

}

console.log("hw7.js loaded");