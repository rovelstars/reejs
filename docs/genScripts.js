window.genScripts = function(obj) {
  window.logger = function (msg, lvl = "DEBUG") {
    lvl = lvl.toUpperCase();
    if(window.REE_ENV=="dev"){
        if(lvl!="DEBUG"){
            console.log(`[${lvl}] ${msg}`);
        }
    }
    else{
    console.log(`[${lvl}] ${msg}`);
    }
  };
  window.$ = function (e) {
    return document.querySelector(e);
  };
  let importmap = $(`script[type="importmap"]`);
  if(!importmap){
      //make a new script element and hook it to the end of head element
      importmap = document.createElement("script");
      importmap.type = "importmap";
      document.head.appendChild(importmap);
  }
  importmap.innerText = JSON.stringify({"imports": obj});
}