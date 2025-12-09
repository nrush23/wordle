const LOI = [[8.4, 5.79], [0.06, 5.47], [-0.09, -5.5], [7.25, -0.02], [3.97, -6.36], [4.46, 6.68], [-0.14, 0.03], [-2.55, 7.25], [-4.44, 1.53], [-4.3, -4.77]];
function getLOI(){
    return Math.floor(Math.random() * LOI.length);
}
class EntityManager{
    prefix;
    DURGS; /**Durg Class */
    ZURGS; /**Zurg Class */
    MAX_ZURGS = 10;
    ZURG_IND=-1;
    constructor(prefix){
        this.DURGS = new Map(); //Use to access and update the other players and yourself
        this.ZURGS = new Array(this.MAX_ZURGS); //Use to access the zombies (initialize all of them, but hide/tuck away in a corner until ready to checkpoint spawn)
        this.prefix = prefix;

        //We will set the texture for Durg and Zurg in the SpawnManager
        addTexture(4, prefix+'/final/textures/', 'zurg.png');
    }
    //NOTE: BOTH ZURGS AND DURGS WILL SHARE TEXTURE 4

    /**Look at final.js makeDurg, ZURGS DO NOT NEED TO BE ROTATED WHEN LOADED (NO ATAN TURN)
     * Model: zurg.ply (public/final/models/zurg.ply)
     * Texture: zurg.png (public/final/textures/zurg.png)
     */
    async addZurg(id){
        if(this.ZURG_IND > this.MAX_ZURGS){
            console.warn("Max zurg limit reached");
            return;
        }else{
            this.ZURG_IND++;
            this.ZURGS[this.ZURG_IND] = new Zurg(this.ZURG_IND);
        }
    }

    /**Look at final.js makeDurg 
     * Model: durg.ply (public/hw10/models/durg.ply)
     * Texture: durg.png (public/hw10/textures/durg.png)
    */
    addDurg(id){
        this.DURGS.set(id, new Durg(id));
    }

    /**Use enum to switch between updating health, position, ammo, etc. */
    updateDurg(id, value){

    }

    /**Same thing as above */
    updateZurg(id, value){

    }
}