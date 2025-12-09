export default class InputManager{
    forward;
    backward;
    left;
    right;
    jump;
    constructor(){
        this.left = false;
        this.right = false;
        this.forward = false;
        this.backward = false;
        this.jump = false;

        this.onKeyDownBound = this.onKeyDown.bind(this);
        this.onKeyUpBound = this.onKeyUp.bind(this);
    }
    addListeners(eventTarget){
        eventTarget.addEventListener("keydown",this.onKeyDownBound);
        eventTarget.addEventListener("keyup",this.onKeyUpBound);
    }
    removeListeners(eventTarget){
        eventTarget.removeEventListener("keydown",this.onKeyDownBound);
        eventTarget.removeEventListener("keyup",this.onKeyUpBound);
    }
    onKeyDown(event){
        //note when a directional is pressed immediately release the opposite directional
        switch (event.key) {
            case "w":
                this.forward = true;
                //this.backward =false;
                break;
            case "s":
                this.backward = true;
                //this.forward = false;
                break;
            case "a":
                this.left = true;
                //this.right = false;
                break;
            case "d":
                this.right = true;
                //this.left = false;
                break;
            case " ":
                this.jump = true;
                break;
        }
    }
    onKeyUp(event) {
        //note on up release the directional
        switch (event.key) {
            case "w":
                this.forward = false;
                break;
            case "s":
                this.backward = false;
                break;
            case "a":
                this.left = false;
                break;
            case "d":
                this.right = false;
                break;
            case " ":
                this.jump = false;
                break;
        }
    }
}