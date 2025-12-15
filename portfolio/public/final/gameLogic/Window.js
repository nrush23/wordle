class Window{
    ID; //ID associated with a mesh, Windows will have 4 meshes to show or hide (1 for each panel)
    health; //Health (number of boards)
    childIDs; //Array storing the individual board IDs
    constructor(ID){
        this.ID = ID;
        this.health = 4; //4 window panels;
        this.childIDs = new Array(this.health);
        for(var i = 0; i < this.health; i++){
            this.childIDs[i] = ID + i;
        }
    }

    getIDS(){
        if (this.health == 0){
            return [];
        }
        return this.childIDs.slice(0, this.health-1);
    }

    updateHealth(health){
        this.health = health;
    }
}