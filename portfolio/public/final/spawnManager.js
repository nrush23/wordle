class SpawnManager{
    prefix;
    DURGS;
    ZURGS;
    MAX_ZURGS = 10;
    ZURG_IND=-1;
    constructor(prefix){
        this.DURGS = new Map();
        this.ZURGS = new Array(this.MAX_ZURGS);
        this.prefix = prefix;
    }

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
}