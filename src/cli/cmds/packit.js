import DynamicImport from "../../imports/dynamicImport.js";
import NativeImport from "../../imports/nativeImport.js";
import SpecialFileImport from "../../imports/specialFileImport.js";
import {Import} from "../../imports/URLImport.js";
import copyFolderSync from "../../utils/copyFolder.js";

let fs = await NativeImport("node:fs");
let path = await NativeImport("node:path");
let {spawn} = await NativeImport("node:child_process");
let terser = await Import("terser@5.16.6");
let importmap =
    fs.existsSync(path.join(process.cwd(), "import_map.json"))
        ? DynamicImport(await import(`${process.cwd()}/import_map.json`,
                                     {assert: {type: "json"}}))
        : {};
let cachemap =
    fs.existsSync(path.join(process.cwd(), ".reejs", "cache", "cache.json"))
        ? DynamicImport(
              await import(`${process.cwd()}/.reejs/cache/cache.json`, {
                assert: {type: "json"},
              }))
        : {};

let childProcess = null;

let getPackage = (pkg) => {
  let url = importmap.imports?.[pkg] || importmap.browserImports?.[pkg];
  if (!url) {
    throw new Error(`Package ${pkg} not found in import map.`);
  }
  return cachemap[url] ? ("./" + path.join(".reejs", "cache", cachemap[url]))
                       : url;
};

let pagesDir = path.join(process.cwd(), "src", "pages");
let componentsDir = path.join(process.cwd(), "src", "components");
let apisDir = path.join(pagesDir, "api");

export let packit = async (service, isDevMode) => {
  if ([ "node", "bun", "deno-deploy", "workers", "vercel" ].indexOf(service) ===
      -1) {
    console.log(
        "%c[PACKIT] %cPlease specify a valid service to pack your project for.\n%cAvailable Services are: node, bun, deno-deploy, workers, vercel.",
        "color: #ff0000", "color: #ffffff", "color: blue");
    return;
  }
  if (service == "node") {
    if (!importmap.imports["@hono/node-server"]) {
      console.log(
          "%c[PACKIT] %cPlease add @hono/node-server to %c`import_map.json`%c use this service.",
          "color: #ff0000", "color: #ffffff", "color: blue", "color: #ffffff");
      return;
    }
    if (!importmap.imports["@hono/serve-static"]) {
      console.log(
          "%c[PACKIT] %cPlease add @hono/serve-static to %c`import_map.json`%c use this service.",
          "color: #ff0000", "color: #ffffff", "color: blue", "color: #ffffff");
      return;
    }
  }
  function getFiles(dir) {
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
  }
  let start = Date.now();
  let pages = getFiles(pagesDir)
                  .map(e => e.replace(pagesDir + "/", ""))
                  .filter((file) => {
                    // filter only js files that are not inside api folder
                    return (!file.startsWith("api") &&
                            (file.endsWith(".js") || file.endsWith(".jsx") ||
                             file.endsWith(".ts") || file.endsWith(".tsx")));
                  });

  let components =
      getFiles(componentsDir)
          .map(e => e.replace(componentsDir + "/", ""))
          .filter((file) => {
            return (file.endsWith(".js") || file.endsWith(".jsx") ||
                    file.endsWith(".ts") || file.endsWith(".tsx"));
          });
  let apis = getFiles(apisDir)
                 .map(e => e.replace(apisDir + "/", ""))
                 .filter((file) => {
                   return file.endsWith(".js") || file.endsWith(".ts");
                 });

  // transpile pages, components and apis
  let cpages = await Promise.all(pages.map(async (page) => {
    let pagePath = path.join(pagesDir, page);
    let d = path.join(
        ".reejs", "serve",
        (await SpecialFileImport(pagePath, null, service)).split("serve/")[1]);
    return [
      page.replace("index", "")
          .replace(".tsx", "")
          .replace(".ts", "")
          .replace(".jsx", "")
          .replace(".js", ""),
      d,
    ];
  }));
  let ccomponents = await Promise.all(components.map(async (component) => {
    let componentPath = path.join(componentsDir, component);
    let d = path.join(".reejs", "serve",
                      (await SpecialFileImport(componentPath, null, service))
                          .split("serve/")[1]);
    return [
      component.replace(".tsx", "")
              .replace(".ts", "")
              .replace(".jsx", "")
              .replace(".js", "") +
          ".js",
      d,
    ];
  }));
  let capis = await Promise.all(apis.map(async (api) => {
    let apiPath = path.join(apisDir, api);
    let d = path.join(
        ".reejs", "serve",
        (await SpecialFileImport(apiPath, null, service)).split("serve/")[1]);
    return [
      api.replace("index", "")
          .replace(".tsx", "")
          .replace(".ts", "")
          .replace(".jsx", "")
          .replace(".js", ""),
      d,
    ];
  }));

  let end = Date.now();

  console.log(`%c[PACKIT] %cTranspiled ${pages.length} pages, ${
                  components.length} components and ${apis.length} apis in %c${
                  (end - start) / 1000}s`,
              "color: #db2777", "color: #ffffff", "color: blue");
  start = Date.now();
  let packitDir = path.join(process.cwd(), "packit");
  if (fs.existsSync(packitDir)) {
    // delete the old packit folder
    fs.rmSync(packitDir, {
      recursive : true,
      force : true,
    });
  }
  fs.mkdirSync(packitDir);
  // copy the package.json, import_map.json, .reecfg, and src folder to
  // the packit folder
  fs.copyFileSync(path.join(process.cwd(), "package.json"),
                  path.join(packitDir, "package.json"));

  fs.copyFileSync(path.join(process.cwd(), "import_map.json"),
                  path.join(packitDir, "import_map.json"));
  fs.copyFileSync(path.join(process.cwd(), ".reecfg"),
                  path.join(packitDir, ".reecfg"));
  if (fs.existsSync(path.join(process.cwd(), ".tsconfig.json"))) {
    fs.copyFileSync(path.join(process.cwd(), ".tsconfig.json"),
                    path.join(packitDir, ".tsconfig.json"));
  }
  if (fs.existsSync(path.join(process.cwd(), ".env"))) {
    fs.copyFileSync(path.join(process.cwd(), ".env"),
                    path.join(packitDir, ".env"));
  }
  copyFolderSync(path.join(process.cwd(), "public"),
                 path.join(packitDir, "public"));
  copyFolderSync(path.join(process.cwd(), "node_modules"),
                 path.join(packitDir, "node_modules"));
  copyFolderSync(path.join(process.cwd(), ".reejs"),
                 path.join(packitDir, ".reejs"));

  // write random 6 digit alphanumeric string to .pack_id
  let packId = Math.random().toString(36).substring(2, 8);
  fs.writeFileSync(path.join(packitDir, ".pack_id"), packId);
  fs.writeFileSync(path.join(packitDir, "__fs.js"),
                   `let __fs = ${JSON.stringify({
                     pages : cpages,
                     components : ccomponents,
                     apis : capis,
                   })};export default __fs;`);
  // link react lib in browser import maps to the react lib in packit folder
  importmap
      .browserImports[`/__reejs/cache/${cachemap[importmap.imports.react]}`] =
      importmap.browserImports.react;
  importmap.browserImports[`../cache/${cachemap[importmap.imports.react]}`] =
      importmap.browserImports.react;
  importmap
      .browserImports[`/__reejs/cache/${cachemap[importmap.imports.hooks]}`] =
      importmap.browserImports.hooks;
  importmap.browserImports[`../cache/${cachemap[importmap.imports.hooks]}`] =
      importmap.browserImports.hooks;
  let appFile = fs.readdirSync(path.join(process.cwd(), "src", "pages"))
                    .filter((file) => {
                      return file.startsWith("_app") &&
                             (file.endsWith(".js") || file.endsWith(".ts") ||
                              file.endsWith(".jsx") || file.endsWith(".tsx"));
                    })[0];
  appFile = await SpecialFileImport(
      path.join(process.cwd(), "src", "pages", appFile), null, service);
  // if cpages includes an array whose first element is "_browser", return back
  // the file to it.
  let browserFn = cpages.filter((page) => page[0] == "_browser");
  let browserFnNeed = browserFn.length > 0;
  let twindFn = cpages.filter((page) => page[0] == "_twind");
  let twindFnNeed = twindFn.length > 0;
  let reenderFile = (await SpecialFileImport(path.join(
      process.cwd(), "node_modules", "@reejs", "react", "reender.js")));
  let reender = "/__reejs" + reenderFile.split(".reejs")[1];
  fs.copyFileSync(reenderFile, path.join(packitDir, ".reejs",
                                         reenderFile.split(".reejs")[1]));
  fs.writeFileSync(
      path.join(packitDir, "index.js"),
      `import "${getPackage("debug")}";
	  ${
          twindFnNeed
              ? `import inline from "${getPackage("@twind/with-react/inline")}";
import tw from "./${twindFn[0][1]}";`
              : ""}
	  ${service == "node" ? `import fs from "node:fs";` : ""}
	  import ReeServer from "./node_modules/@reejs/server/index.js";
			${
          service == "deno-deploy"
              ? "import { serve } from 'https://deno.land/std/http/server.ts'"
              : ""}
		import { Hono } from "${getPackage("hono")}";${
          service === "node" ? `
		import { serve } from "${getPackage("@hono/node-server")}";
	    import { serveStatic } from "${getPackage("@hono/serve-static")}"`
                             : ""}
		import render from "${getPackage("render")}";
		import React from "${getPackage("react")}";
		import App from "./.reejs${appFile.split(".reejs")[1]}";
		const server = new ReeServer(Hono, {${
          service === "node" ? "serve," : ""}});
	${
          cpages.length > 0
              ? `
		${
                    cpages.filter((page) => !page[0].startsWith("_"))
                        .map(
                            (page) => `import file_${
                                page[1].split("serve/")[1].split(
                                    ".")[0]} from "./${page[1]}";
							server.app.get("/${
                                page[0]}",(c)=>{ let h = "<!DOCTYPE html>"+render(React.createElement(App,null,React.createElement(file_${
                                page[1].split("serve/")[1].split(".")
                                    [0]},null))).replace('<script id="__reejs"></script>','<script type="importmap">{"imports":${
                                JSON.stringify(
                                    importmap
                                        .browserImports)}}</script><script type="module">${
                                isDevMode
                                    ? 'await import("https://esm.sh/preact@10.13.2/debug");'
                                    : ''}let i=(await import("${
                                reender}")).default;i("${
                                page[1].split("serve/")[1].split(".")[0]}.js",${
                                browserFnNeed ? `"${
                                                    browserFn[0][1].replace(
                                                        '.reejs', '/__reejs')}"`
                                              : 'null'});</script>');return ${
                                twindFnNeed ? "c.html(inline(h,tw))"
                                            : "c.html(h)"}});
							`)
                        .join("\n")}
			`
                                              : ""                                }
		${
          capis.length > 0
                                              ? `
		${
                    capis
                        .map(
                            (api) =>
                                (api[0].startsWith("_"))
                                                                    ? `import "./${api[1]}";`
                                                                    : `import * as file_${
                                          api[1].split("serve/")[1].split(
                                              ".")[0]} from "./${
                                          api[1]}";server.app[file_${
                                          api[1].split("serve/")[1].split(".")
                                              [0]}?.method?.toLowerCase() || "get"]("/api/${
                                          api[0]}",file_${
                                          api[1].split("serve/")[1].split(
                                              ".")[0]}.default);`)
                        .join("\n")}`
                                              : ""                                }

		${
          (service === "node")
                                              ? "server.app.get('/__reejs/**',serveStatic({root:'./__reejs/',rewriteRequestPath:(p)=>p.replace('/__reejs','')}));server.app.get('/**',serveStatic({root:'./public',rewriteRequestPath:(p)=>p.replace('/public','')}));"
                                              : ""                                }
	  ${
          service === "node"
                                              ? "server.listen(process.env.PORT || 3000, () => console.log(`Server started on port ${process.env.PORT || 3000}`));"
                                              : ""                                }
	${service == "workers" ? "export default server.app;" : ""                                }
	${service == "deno-deploy" ? "serve(server.app.fetch)" : ""                                }
			`);

  end = Date.now();
  console.log(`%c[PACKIT] %cpacked in %c${(end - start) / 1000}s`,
              "color: #db2777", "color: #ffffff", "color: blue");

  if (childProcess && service == "node") {
    console.log("%c[PACKIT] %cstopping server", "color: #db2777",
                "color: #ffffff");
    process.kill(-childProcess.pid);
  }
  if (service == "node" && isDevMode) {
    console.log("%c[PACKIT] %cstarting server", "color: #db2777",
                "color: #ffffff");
    childProcess = spawn("node", [ path.join(packitDir, "index.js") ],
                         {detached : true, stdio : "inherit"});
  }
};
export default function Packit(prog) {
  prog.command("packit [service]")
      .describe("Pack your project for deployment")
      .option("-d, --dev", "Run in development mode")
      .action(async (service, opts) => {
        let watch = opts.dev || opts.d;
        if (watch) {
          packit(service);
          console.log("%c[PACKIT] %cPress %c`r` %cto restart", "color: #db2777",
                      "color: #ffffff", "color: blue", "color: #ffffff");
          // watch for keypress r
          let readline = DynamicImport(await import("node:readline"));
          // Emit keypress events on process.stdin
          readline.emitKeypressEvents(process.stdin)
          // Set raw mode to true to get individual keystrokes
          if (process.stdin.isTTY) {
            process.stdin.setRawMode(true)
          }
          // Listen to the 'keypress' event
          process.stdin.on('keypress', (str, key) => {
            if (key.name == "r") {
              console.log("%c[PACKIT] %cRestarting...", "color: #db2777",
                          "color: #ffffff");
              packit(service, true);
            }
            // Exit if Ctrl+C is pressed
            if (key && key.ctrl && key.name == 'c') {
              process.exit()
            }
          })
        } else
          packit(service, false);
      });
}
