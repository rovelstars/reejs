import URLImport, { Import } from "./URLImport.js";
let htm = await Import("htm@3.1.1");
function h(type, props, ...children) {
  return { type, props, children };
}

const html = htm.bind(h);

console.log(html`<h1 id="hello">Hello world!</h1>`);
