let path = await import("./pathToRegexp.js");
import { render } from "./reender.js";
let data;
let initHead;
let currentHead;
export async function load(url = "/", config = {
    scrolling: true,
    popped: false,
    init: false
}) {
  if (config.init) {
    //make a new element with id __reejs_data and append it to the end of body
    if (!data) {
      data = document.createElement("div");
      data.id = "__reejs_data";
      data.style.display = "none";
      document.body.appendChild(data);
      let t = document.createElement("div");
      t.id = "__reejs_temp_render";
      data.appendChild(t);
    }
  }
  if(ree.cfg("render")=="csr"){
  await render(url);
  }
}
