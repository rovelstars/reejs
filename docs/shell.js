//exports a global object named ree
window.ree = {};
let $ = function(selector){
    return document.querySelector(selector);
}
let $$ = function(selector){
    return document.querySelectorAll(selector);
}
window.logger = function(msg,lvl = "debug"){
    lvl = lvl.toUpperCase();
    if(ree.opts.env=="dev" && lvl=="DEBUG"){
        console.log("[DEBUG]",msg);
    }
    else if(lvl!="DEBUG"){
        console.log(`[${lvl}]`,msg);
    }
}
ree.init = async function(options) {
    // options: {app: "",env: "",render:""}
    options.env=="dev"?"dev":"prod";
    ree.opts = options;
    let app = $(`#${options.app}`);
    if(!app){
        logger(`App ${options.app} not found! This usually means the initialization is not ran after window load, or it was ran before ${options.app} element was initialized.`, "error");
        return;
    }
    if(!options.render){
        logger(`Render type not specified!`, "error");
        return;
    }
    logger("Starting Ree.js App", "DEBUG");
    let routes = await fetch("/routes.json").then(res=>res.json());
    let cfg = await fetch("/.reecfg").then(res=>res.text());
    cfg = cfg.split("\n").filter((l) => !l.startsWith("#")),
    ree.cfg = function (word) {
        let e = cfg.filter((l) => {
          return l.split(":")[0] == word;
        });
        if (e?.length) return e[0].replace(`${word}:`, "");
        else return undefined;
      }
    logger("Registering Routes","DEBUG");
    ree.routes = routes;
    ree.router = await import("./router.js");
    logger(`Render type: ${ree.cfg("render")}`, "DEBUG");
    ree.router.load(undefined,{init:true});
    };
