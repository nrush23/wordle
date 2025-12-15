const SPAWN = [[10,10], [5,5]]; //List of Zombie spawns (will be set with Blender)


class Zurg{
    health;
    target;
    id;
    body;
    constructor(id){
        this.health = 20;
        this.id = id;
        this.body = this.makeBody();
    }

    async makeBody(target=[4,4]){
        const FILE = 'zurg.ply';
        const PATH = '/final/models/';

        let data = await Parser.importMesh(PATH, FILE, true);
        let M = new Mesh(data, false, false, 8, 4);

        const spawn = this.getSpawn();
        M.move(spawn[0],1,spawn[1]);

        this.setTarget(target);

        this.body = M;
    }

    /**Delta time */
    
    animate(time){
        const pos = this.body.getPosition(false);
        const velocity = {x: this.target[0] - pos.x, z: this.target[1] - pos.z};
        var length = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y + velocity.z * velocity.z);
        length = length == 0 ? 1: length;
        if (length == 0){
            this.setTarget(this.getSpawn());
            return;
        }
        velocity.x /= length;
        velocity.z /= length;
        velocity.y /= length;
        this.body.setPosition(pos.x + (velocity.x*time),pos.y + (velocity.y*time),pos.z + (velocity.z*time));
    }
    
    getSpawn(){
        const spawn = SPAWN[Math.floor(Math.random * SPAWN.length)];
        return spawn;
    }

    setTarget(position){
        this.target = position;
    }
}

console.log("Loaded Zurg.js");