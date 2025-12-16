export default class InputManager{
    forward;
    backward;
    left;
    right;
    jump;
    constructor(){
        this.gameShell = undefined;
        this.left = false;
        this.right = false;
        this.forward = false;
        this.backward = false;
        this.jump = false;

        this.arrowKeyUp = false;
        this.arrowKeyDown = false;
        this.arrowKeyLeft = false;
        this.arrowKeyRight = false;

        this.onKeyDownBound = this.onKeyDown.bind(this);
        this.onKeyUpBound = this.onKeyUp.bind(this);
        this.onMouseDownBound = this.onMouseDown.bind(this);
    }
    addListeners(eventTarget){
        eventTarget.addEventListener("keydown",this.onKeyDownBound);
        eventTarget.addEventListener("keyup",this.onKeyUpBound);
        eventTarget.addEventListener("mousedown",this.onMouseDownBound);
    }
    removeListeners(eventTarget){
        eventTarget.removeEventListener("keydown",this.onKeyDownBound);
        eventTarget.removeEventListener("keyup",this.onKeyUpBound);
        eventTarget.removeEventListener("mousedown",this.onMouseDownBound);
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
            case "ArrowUp":
                this.arrowKeyUp = true;
                break;
            case "ArrowDown":
                this.arrowKeyDown = true;
                break;
            case "ArrowLeft":
                this.arrowKeyLeft = true;
                break;
            case "ArrowRight":
                this.arrowKeyRight = true;
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
            case "ArrowUp":
                this.arrowKeyUp = false;
                break;
            case "ArrowDown":
                this.arrowKeyDown = false;
                break;
            case "ArrowLeft":
                this.arrowKeyLeft = false;
                break;
            case "ArrowRight":
                this.arrowKeyRight = false;
                break;
        }
    }
    onMouseDown(event){
        this.gameShell.dispatchEvent(new CustomEvent("shoot"));
    }
}