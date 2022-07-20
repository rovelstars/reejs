let renderType = ree.opts.render;
let lib = await import("./ree.react.js");

export async function render(url,config){
    url = url.slice(1);
    if(url==""){
        url="index";
    }

if(renderType=="react"){
    let page = await import(`/pages/${url}.js`);
    function decodeHTMLEntities(text) {
        var textArea = document.createElement('textarea');
        textArea.innerHTML = text;
        return textArea.value;
      }
      setTimeout(()=>{
         lib.render(
        lib.html`<${page.default} ${config?.data?`data=${config.data}`:""} />`,
        document.getElementById("__reejs_temp_render")
      );
      let html = $("#__reejs_temp_render").innerHTML;
      html = decodeHTMLEntities(html);
        $(`${config?.loader?"#loader":`#${ree.opts.app}`}`).innerHTML = html;
        $("#__reejs_temp_render").remove();
      },0);
   
}
}
