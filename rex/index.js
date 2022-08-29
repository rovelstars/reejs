//create a class that exposes a method to create a new instance of server
import Import from "../server/import.js";
export default class Server {
    constructor(type) {
        this.init(type);
    }
    async init(type){
        if(!globalThis.Request && !globalThis.Response) {
            let {Request, Response} = await Import("undici");
        }
        this.type = type;
        let bare;
        if(type=="node"){
            bare = await Import("h3");
        }
        else if(type=="cf"){
            bare = await Import("/rex/cf/index.js");
        }
    }
}