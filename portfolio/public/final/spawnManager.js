class SpawnManager{
    prefix;
    DURGS; /**Durg Class */
    ZURGS; /**Zurg Class */
    MAX_ZURGS = 10;
    ZURG_IND=-1;
    constructor(prefix){
        this.DURGS = new Map(); //Use to access and update the other players and yourself
        this.ZURGS = new Array(this.MAX_ZURGS); //Use to access the zombies (initialize all of them, but hide/tuck away in a corner until ready to checkpoint spawn)
        this.prefix = prefix;
    }

    /**Look at final.js makeDurg, ZURGS DO NOT NEED TO BE ROTATED WHEN LOADED (NO ATAN TURN)
     * Model: zurg.ply (public/final/models/zurg.ply)
     * Texture: zurg.png (public/final/textures/zurg.png)
     */
    addZurg(id){
        if(this.ZURG_IND > this.MAX_ZURGS){
            console.warn("Max zurg limit reached");
            return;
        }else{
            this.ZURG_IND++;
            //Code for importing mesh from the parser
            this.ZURGS[this.ZURG_IND] 
        }
    }

    /**Look at final.js makeDurg 
     * Model: durg.ply (public/hw10/models/durg.ply)
     * Texture: durg.png (public/hw10/textures/durg.png)
    */
    addDurg(id){

    }

    /**Use enum to switch between updating health, position, ammo, etc. */
    updateDurg(id, value){

    }

    /**Same thing as above */
    updateZurg(id, value){

    }
}