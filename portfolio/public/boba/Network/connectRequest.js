import Message from "./message.js";
export default class ConnectRequestMessage extends Message{
    id = 0;
    username;
    constructor(username,secretKey){
        super();
        this.username = username;
        this.secretKey = secretKey;
    }
    serialize(){
        return {
            id:this.id,
            payload:"Requesting connection",
            username:this.username,
            secretKey:this.secretKey
        }
    }
    deserialize(data){
        return{
            id:data.id,
            payload:data.payload
        }
    }
}