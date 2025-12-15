import GameSession from "./gameSession.js";


/** @param {GameSession} gameSession access to entire game session object 
 *  @function customEventHandler function to hook up generic game message events to send data to server and receive response
*/
export default function customEventHandler(gameSession){

    console.log("custom event handler hooked up");

    const EVENTS ={
        TEST_MESSAGE:"TEST_MESSAGE",

    };

    //send message
    gameSession.sendMessage(EVENTS.TEST_MESSAGE,{text:"hello world"});

    //if needing a response hook response listener
    gameSession.addEventListener(EVENTS.TEST_MESSAGE,(event)=>{
        let text = event.detail.text;
        console.log(text);
    });
}