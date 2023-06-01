import NativeImport from "@reejs/imports/nativeImport.js";
let fs = await NativeImport("node:fs");
let path = await NativeImport("node:path");
import SpecialFileImport from "@reejs/imports/specialFileImport.js";

export function getFiles(dir) {
  try {
    const files = fs.readdirSync(dir);
    let fileList = [];

    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        fileList = fileList.concat(getFiles(filePath));
      } else {
        fileList.push(filePath);
      }
    });

    return fileList;
  } catch (e) {
    // fixes: cannot find src/components
    return [];
  }
}

export let readers = {
  "pages": () => {
    let pagesDir = path.join(".", "src", "pages");
    return getFiles(pagesDir)
      .map(e => e.replace(pagesDir + "/", ""))
      .filter((file) => {
        // filter only js files that are not inside api folder
        return (!file.startsWith("api") &&
          (file.endsWith(".js") || file.endsWith(".jsx") ||
            file.endsWith(".ts") || file.endsWith(".tsx")));
      }).map((file) => path.join(pagesDir, file));
  },
  "components": () => {
    let componentsDir = path.join(".", "src", "components");
    return getFiles(componentsDir)
      .map(e => e.replace(componentsDir + "/", ""))
      .filter((file) => {
        return (file.endsWith(".js") || file.endsWith(".jsx") ||
          file.endsWith(".ts") || file.endsWith(".tsx"));
      }).map((file) => path.join(componentsDir, file));
  },
  "apis": () => {
    let apisDir = path.join(".", "src", "pages", "apis");
    return getFiles(apisDir)
      .map(e => e.replace(apisDir + "/", ""))
      .filter((file) => {
        return file.endsWith(".js") || file.endsWith(".ts");
      }).map((file) => path.join(apisDir, file));
  },
}

export let defaultTranspiler = async (fileURL, service) => {
  return await SpecialFileImport(fileURL, null, service);
}

export let transpilers = {
  "ts": defaultTranspiler,
  "jsx": defaultTranspiler,
  "md": defaultTranspiler,
  "mdx": defaultTranspiler,
  "js": defaultTranspiler,
  "tsx": defaultTranspiler
}
export let writers = [
  {
    "name": "pages",
    "run": async (helpers, service) => {
      //get pages from savedFiles
      //savedFiles = [...,{pages:[]},...]
      let pages = helpers.savedFiles.find(e => e.pages).pages;
      let { TranspileFile, mainFile, processCwd, importmap, isDevMode, getPackage} = helpers;
      let reenderFile = (await SpecialFileImport(path.join(
        processCwd, "node_modules", "@reejs", "react", "reender.js")));
      let reender = "/__reejs" + reenderFile.split(".reejs")[1];
      let browserFn = pages.filter((page) => page.startsWith("src/pages/_browser"));
      let browserFnNeed = browserFn.length > 0;
      let twindFn = await TranspileFile(pages.filter((page) => page.startsWith("src/pages/_twind"))[0]);
      let appFile = await TranspileFile(pages.find((page) => page.startsWith("src/pages/_app")));
      mainFile = `${isDevMode ? "import '@reejs/utils/log.js';" : ""}
import "${getPackage("debug")}";
${(twindFn?.length > 0)
          ? `import inline from "${getPackage("@twind/with-react/inline")}";
import tw from "./.reejs/${twindFn.split(".reejs/")[1]}";`
          : ""}
${service == "node" ? `import fs from "node:fs";` : ""}
import ReeServer from "./node_modules/@reejs/server/index.js";
${service == "deno-deploy"
          ? "import { serve } from 'https://deno.land/std/http/server.ts'"
          : ""}
import { Hono } from "${getPackage("hono")}";${service === "node" ? `
import { serve } from "${getPackage("@hono/node-server")}";
import { compress } from "${getPackage("hono/compress")}";
import { serveStatic } from "${getPackage("@hono/serve-static")}"`
          : ""}
import render from "${getPackage("render")}";
import React from "${getPackage("react")}";
import App from "./.reejs${appFile.split(".reejs")[1]}";
const server = new ReeServer(Hono, {${service === "node" ? "serve," : ""}});
server.app.onError(console.log);
//server.app.use('*',compress());`;
      // we generate routes for pages here.
      await Promise.all(pages.map(async (page) => {
        let route = page.replace("src/pages/", "")
		  .replace("index", "")
          .replace(".tsx", "")
          .replace(".ts", "")
          .replace(".jsx", "")
          .replace(".js", "");
        let savedAt = await TranspileFile(page);
        let sha_name = savedAt.split("serve/")[1].split(
          ".")[0];
        mainFile += `\nimport file_${sha_name} from "./.reejs/${savedAt.split(".reejs/")[1]}";server.app.get("/${route}",(c)=>{ let h = "<!DOCTYPE html>"+render(React.createElement(App,null,React.createElement(file_${savedAt.split("serve/")[1].split(".")
        [0]},null))).replace('<script id="__reejs"></script>','<script type="importmap">{"imports":${JSON.stringify(
          importmap
            .browserImports)}}</script><script type="module">${isDevMode
              ? 'await import("https://esm.sh/preact@10.13.2/debug");'
              : ''}let i=(await import("${reender}")).default;i("./${savedAt.split(".reejs/")[1]}",${browserFnNeed ? `"${browserFn[0][1].replace('.reejs', '/__reejs')}"`
                : 'null'});</script>');return ${twindFn?.length > 0 ? "c.html(inline(h,tw).replaceAll('{background-clip:text}','{-webkit-background-clip:text;background-clip:text}'))"
                  //TODO: wait for twind to add vendor prefix for `background-clip:text`, then remove the replaceAll.
                  : "c.html(h)"}});`;
      }));
      mainFile+=`\n${service === "node"
      ? "server.listen(process.env.PORT || 3000, () => {console.log(`%c  ➜  %cLocal:%chttp://localhost:${process.env.PORT || 3000}`,\"color: #db2777\",\"color: #6b7280\",\"color: blue; font-weight: bold;\")});"
      : ""}
${service == "workers" ? "export default server.app;" : ""}
${service == "deno-deploy" ? "serve(server.app.fetch)" : ""}
`;
      return mainFile;
    }
  }
]

export let copyToPackit = {
  files: [
    "package.json",
    "import_map.json",
    ".reecfg.json",
    "tailwind.config.js",
    "twind.config.js",
  ],
  folders: [
    ".reejs",
    "node_modules",
    "public", //I think we shouldnt copy src folder. .reejs folder will save transpiled files and also copy required js files.
  ]
};
