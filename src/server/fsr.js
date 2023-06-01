// file system router
// works for hono

import DynamicImport from "../imports/dynamicImport.js";
import NativeImport from "../imports/nativeImport.js";
import SpecialFileImport from "../imports/specialFileImport.js";
let fs = await NativeImport("node:fs");
let path = await NativeImport("node:path");
let pagesDir = path.join(process.cwd(), "src", "pages");
let componentsDir = path.join(process.cwd(), "src", "components");
let pages = fs.readdirSync(pagesDir).filter((file) => {
  // filter only js files that are not inside api folder
  return !file.startsWith("api") &&
         (file.endsWith(".js") || file.endsWith(".jsx") ||
          file.endsWith(".ts") || file.endsWith(".tsx"));
});
let components = fs.readdirSync(componentsDir)
                     .filter((file) => { return file.endsWith(".js"); });
let apis = fs.readdirSync(path.join(pagesDir, "api"))
               .filter((file) => { return file.endsWith(".js"); });

export default async function ReeFSR({app,opts}){
  // register pages
  let { render } = opts;
	console.log("reefsr");
	if(!render){
		throw new Error("render function must be provided in option when initializing ReeServer");
	}
  for (let page of pages) {
    let route = page.replace("index","").replace(".tsx","").replace(".ts","").replace(".jsx","").replace(".js","");
	  console.log(page, route);
    let routePath = "/" + route;
    let routeData = DynamicImport(await import(await SpecialFileImport(path.join(pagesDir, page))));
	  console.log("Registering page: ",routePath);
    app.get(routePath, (c)=>{
		return c.html(render(routeData.default));
	});
  }
	for(let page of components){
let route = page.replace("index","").replace(".tsx","").replace(".ts","").replace(".jsx","").replace(".js","");
	  console.log(page, route);
    let routePath = "/__reejs/" + route;
    let routeData = DynamicImport(await import(await SpecialFileImport(path.join(pagesDir, page))));
	  console.log("Registering Component: ",routePath);
    app.get(routePath, (c)=>{
		return c.html(render(routeData.default));
	});
  }
	for(let page of apis){
let route = page.replace("index","").replace(".tsx","").replace(".ts","").replace(".jsx","").replace(".js","");
	  console.log(page, route);
    let routePath = "/api/"+ route;
    let routeData = DynamicImport(await import(await SpecialFileImport(path.join(pagesDir, page))));
	  console.log("Registering page: ",routePath);
    app.get(routePath, routeData.default);
  }
}
