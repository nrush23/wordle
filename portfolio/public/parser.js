let Parser = {
    async importMesh(path_src, file_name) {
        //Get the text stream
        const stream = await fetch(this.prefix + path_src + file_name).then(res => res.text());
        const SPACE = ' ';
        //Now split by lines
        let lines = stream.split('\n')
        // console.log(lines)
        //Get the vertex count (Line 4 (3), last element)
        let vertex_line = lines[3].split(' ')
        const V = parseInt(vertex_line[vertex_line.length - 1]);

        //Get the face count (Line 14 (12), last element)
        let face_line = lines[12].split(' ')
        const F = parseInt(face_line[face_line.length - 1]);

        //Vertices range Line 16 (15) until Line 16 + V - 1 (16 + V - 2)
        let VERTICES = new Array(V);
        for (let i = 15; i < 15 + V; i++) {
            let point = lines[i].split(SPACE).slice(0, 6);
            VERTICES[i - 15] = Float32Array.from(point, parseFloat);
        }

        //Now get our faces
        let FACES = new Array(F);
        for (let i = 15 + V; i < lines.length; i++) {
            let face_map = lines[i].split(SPACE).slice(1);
            FACES[i - (15 + V)] = Int32Array.from(face_map, Number);
        }

        //Now build our data map
        let triangles = [];
        for (let i = 0; i < F; i++){
            FACES[i].forEach(face => {
                triangles.push(...VERTICES[face]);
            });
        }
        const data = new Float32Array(triangles);
        return data;
    },

    async importAllFrom(folder){

    }
}