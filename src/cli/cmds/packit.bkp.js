import DynamicImport from "../../imports/dynamicImport.js";
import NativeImport from "../../imports/nativeImport.js";
import SpecialFileImport from "../../imports/specialFileImport.js";
import { Import } from "../../imports/URLImport.js";
import copyFolderSync from "../../utils/copyFolder.js";

let fs = await NativeImport("node:fs");
let path = await NativeImport("node:path");
let { spawn } = await NativeImport("node:child_process");
let terser = await Import("terser@5.16.6");
let processCwd = globalThis?.process?.cwd?.() || Deno.cwd();

let importmap =
  fs.existsSync(path.join(processCwd, "import_map.json"))
    ? DynamicImport(await import(`${processCwd}/import_map.json`,
      { assert: { type: "json" } }))
    : {};
let cachemap =
  fs.existsSync(path.join(processCwd, ".reejs", "cache", "cache.json"))
    ? DynamicImport(
      await import(`${processCwd}/.reejs/cache/cache.json`, {
        assert: { type: "json" },
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

let getBrowserPackage = (pkg) => {
  let url = importmap.browserImports?.[pkg];
  if (!url) {
    throw new Error(`Package ${pkg} not found in import map (BrowserImports).`);
  }
  return url;
};

let pagesDir = path.join(processCwd, "src", "pages");
let componentsDir = path.join(processCwd, "src", "components");
let apisDir = path.join(pagesDir, "api");

export let packit = async (service, isDevMode) => {
  let features = (await import(`${processCwd}/.reecfg.json`, {
    assert: { type: "json" }
  })).features;
  if (["node", "bun", "deno-deploy", "workers", "vercel"].indexOf(service) ===
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
        .replace(".js", "")
        .replace(".md",""),
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
        .replace(".js", "")
        .replace(".md","") +
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
        .replace(".js", "")
        .replace(".md",""),
      d,
    ];
  }));

  let end = Date.now();

  console.log(`%c[PACKIT] %cTranspiled ${pages.length} pages, ${components.length} components and ${apis.length} apis in %c${(end - start) / 1000}s`,
    "color: #db2777", "color: #ffffff", "color: blue");
  start = Date.now();
  let packitDir = path.join(processCwd, "packit");
  if (fs.existsSync(packitDir)) {
    // delete the old packit folder
    fs.rmSync(packitDir, {
      recursive: true,
      force: true,
    });
  }
  fs.mkdirSync(packitDir);
  // copy the package.json, import_map.json, .reecfg, and src folder to
  // the packit folder
  fs.copyFileSync(path.join(processCwd, "package.json"),
    path.join(packitDir, "package.json"));

  fs.copyFileSync(path.join(processCwd, "import_map.json"),
    path.join(packitDir, "import_map.json"));
  fs.copyFileSync(path.join(processCwd, ".reecfg.json"),
    path.join(packitDir, ".reecfg.json"));
  if (fs.existsSync(path.join(processCwd, ".tsconfig.json"))) {
    fs.copyFileSync(path.join(processCwd, ".tsconfig.json"),
      path.join(packitDir, ".tsconfig.json"));
  }
  if (fs.existsSync(path.join(processCwd, ".env"))) {
    fs.copyFileSync(path.join(processCwd, ".env"),
      path.join(packitDir, ".env"));
  }
  copyFolderSync(path.join(processCwd, "public"),
    path.join(packitDir, "public"));
  if (fs.existsSync(path.join(processCwd, "node_modules"))) {
    copyFolderSync(path.join(processCwd, "node_modules"),
      path.join(packitDir, "node_modules"));
  }
  if (fs.existsSync(path.join(processCwd, ".reejs"))) {
    copyFolderSync(path.join(processCwd, ".reejs"),
      path.join(packitDir, ".reejs"));
  }

  // write random 6 digit alphanumeric string to .pack_id
  let packId = Math.random().toString(36).substring(2, 8);
  fs.writeFileSync(path.join(packitDir, ".pack_id"), packId);
  fs.writeFileSync(path.join(packitDir, "__fs.js"),
    `let __fs = ${JSON.stringify({
      pages: cpages,
      components: ccomponents,
      apis: capis,
    })};export default __fs;`);
  // link react lib in browser import maps to the react lib in packit folder
  // importmap
  //   .browserImports[`/__reejs/cache/${cachemap[importmap.imports.react]}`] =
  //   importmap.browserImports.react;
  // importmap.browserImports[`../cache/${cachemap[importmap.imports.react]}`] =
  //   importmap.browserImports.react;
  // importmap
  //   .browserImports[`/__reejs/cache/${cachemap[importmap.imports.hooks]}`] =
  //   importmap.browserImports.hooks;
  // importmap.browserImports[`../cache/${cachemap[importmap.imports.hooks]}`] =
  //   importmap.browserImports.hooks;
  let appFile = fs.readdirSync(path.join(processCwd, "src", "pages"))
    .filter((file) => {
      return file.startsWith("_app") &&
        (file.endsWith(".js") || file.endsWith(".ts") ||
          file.endsWith(".jsx") || file.endsWith(".tsx"));
    })[0];
  appFile = await SpecialFileImport(
    path.join(processCwd, "src", "pages", appFile), null, service);
  // if cpages includes an array whose first element is "_browser", return back
  // the file to it.
  let browserFn = cpages.filter((page) => page[0] == "_browser");
  let browserFnNeed = browserFn.length > 0;
  let twindFn = cpages.filter((page) => page[0] == "_twind");
  let twindFnNeed = twindFn.length > 0;
  let reenderFile = (await SpecialFileImport(path.join(
    processCwd, "node_modules", "@reejs", "react", "reender.js")));
  let reender = "/__reejs" + reenderFile.split(".reejs")[1];
  fs.copyFileSync(reenderFile, path.join(packitDir, ".reejs",
    reenderFile.split(".reejs")[1]));
  let {contentType} = await Import("mime-types@2.1.35");
  let reejsSavedFilesCache = fs.readdirSync(path.join(processCwd, ".reejs", "cache"));
  let reejsSavedFilesServe = fs.readdirSync(path.join(processCwd, ".reejs", "serve"));
  let publicSavedFiles = getFiles(path.join(processCwd,"public")).map(f=>f.replace(processCwd,"."));
  let reejsSavedFilesString = "";
  if (service == "deno-deploy" || service == "node") {
    reejsSavedFilesString =
      reejsSavedFilesCache
        .map((file) => {
          return `let cache_${file.replace(".", "")} = ${service == "node" ? "fs.readFileSync" : "await Deno.readFile"}("./.reejs/cache/${file}");server.app.get("/__reejs/cache/${file}", (c)=>{c.header('Content-type','${
            contentType(file)
          }');return c.body(cache_${file.replace(".", "")})});`;
        })
        .join("\n") +
      reejsSavedFilesServe
        .map((file) => {
          return `let serve_${file.replace(".", "")} = ${service == "node" ? "fs.readFileSync" : "await Deno.readFile"}("./.reejs/serve/${file}");server.app.get("/__reejs/serve/${file}", (c)=>{c.header('Content-type','${
            contentType(file)
          }');return c.body(serve_${file.replace(".", "")})});`;
        })
        .join("\n") +
        publicSavedFiles.map((file)=>{
          return `let public_${file.replaceAll("/","__").replaceAll(".","")} = ${service == "node" ? "fs.readFileSync":"await Deno.readFile"}("${file}");server.app.get("${file.slice(file.indexOf("/",2))}",(c)=>{c.header('Content-type','${
            contentType(file)
          }');return c.body(public_${file.replaceAll("/","__").replaceAll(".","")})});`;
        })
  }

  //convert importmap.browserImports from {"react":"https://cdn.skypack.dev/react"} to {"../cache/<hash>":"https://cdn.skypack.dev/react"}
  let convertedBrowserImports = {};
  for (let key in Object.keys(importmap.browserImports)) {
    let keyForImport = Object.keys(importmap.browserImports)[key];
    convertedBrowserImports[getPackage(keyForImport).replace("./.reejs","/__reejs")] = importmap.browserImports[Object.keys(importmap.browserImports)[key]];
    convertedBrowserImports[getPackage(keyForImport).replace("./.reejs","..")] = importmap.browserImports[Object.keys(importmap.browserImports)[key]];
  }
  // add convertedBrowserImports to importmap.browserImports along with old importmap.browserImports
  importmap.browserImports = {
    ...convertedBrowserImports,
    ...importmap.browserImports,
  };
  fs.writeFileSync(
    path.join(packitDir, "index.js"),
    `${isDevMode ? "import 'reejs/src/imports/URLImportInstaller.js';" : ""}
    import "${getPackage("debug")}";
	  ${twindFnNeed
      ? `import inline from "${getPackage("@twind/with-react/inline")}";
import tw from "./${twindFn[0][1]}";`
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
    server.app.use('*',compress());
	${cpages.length > 0
      ? `
		${cpages.filter((page) => !page[0].startsWith("_"))
        .map(
          (page) => `import file_${page[1].split("serve/")[1].split(
            ".")[0]} from "./${page[1]}";
							server.app.get("/${page[0]}",(c)=>{ let h = "<!DOCTYPE html>"+render(React.createElement(App,null,React.createElement(file_${page[1].split("serve/")[1].split(".")
            [0]},null))).replace('<script id="__reejs"></script>','<script type="importmap">{"imports":${JSON.stringify(
              importmap
                .browserImports)}}</script><script type="module">${isDevMode
                  ? 'await import("https://esm.sh/preact@10.13.2/debug");'
                  : ''}let i=(await import("${reender}")).default;i("${page[1].split("serve/")[1].split(".")[0]}.js",${browserFnNeed ? `"${browserFn[0][1].replace(
                    '.reejs', '/__reejs')}"`
                    : 'null'});</script>');return ${twindFnNeed ? "c.html(inline(h,tw).replaceAll('{background-clip:text}','{-webkit-background-clip:text;background-clip:text}'))"
//TODO: wait for twind to add vendor prefix for `background-clip:text`, then remove the replaceAll.
                    : "c.html(h)"}});
							`)
        .join("\n")}
			`
      : ""}
		${capis.length > 0
      ? `
		${capis
        .map(
          (api) =>
            (api[0].startsWith("_"))
              ? `import "./${api[1]}";`
              : `import * as file_${api[1].split("serve/")[1].split(
                ".")[0]} from "./${api[1]}";server.app[file_${api[1].split("serve/")[1].split(".")
                [0]}?.method?.toLowerCase() || "get"]("/api/${api[0]}",file_${api[1].split("serve/")[1].split(
                  ".")[0]}.default);`)
        .join("\n")}`
      : ""}

		${(service !== "node") //todo: make a custom serveStatic myself.
      ? "server.app.get('/__reejs/**',serveStatic({root:'./__reejs/',rewriteRequestPath:(p)=>p.replace('/__reejs','')}));server.app.get('/**',serveStatic({root:'./public',rewriteRequestPath:(p)=>p.replace('/public','')}));"
      : (((service == "deno-deploy") || (service == "node")) ? reejsSavedFilesString : "")}
	  ${service === "node"
      ? "server.listen(process.env.PORT || 3000, () => console.log(`Server started on port ${process.env.PORT || 3000}`));"
      : ""}
	${service == "workers" ? "export default server.app;" : ""}
	${service == "deno-deploy" ? "serve(server.app.fetch)" : ""}
			`);

  end = Date.now();
  console.log(`%c[PACKIT] %cpacked in %c${(end - start) / 1000}s`,
    "color: #db2777", "color: #ffffff", "color: blue");

  if (childProcess && service == "node") {
    console.log("%c[PACKIT] %cstopping server", "color: #db2777",
      "color: red");
    if (!childProcess.exitCode) process.kill(-childProcess.pid);
  }
  if (service == "node" && isDevMode) {
    console.log("%c[PACKIT] %cstarting server", "color: #db2777",
      "color: green");
    childProcess = spawn("node", [path.join(packitDir, "index.js")],
      { detached: true, stdio: "inherit" });
  }
};
export default function Packit(prog) {
  prog.command("packit [service]")
    .describe("Pack your project for deployment")
    .option("-d, --dev", "Run in development mode")
    .action(async (service, opts) => {
      let watch = opts.dev || opts.d;
      if (watch) {
        if(globalThis?.process?.env) process.env.NODE_ENV = "development";
        if(globalThis?.Deno?.env) Deno.env.set("NODE_ENV", "development");
        packit(service,true);
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
            if (childProcess && service == "node") {
              console.log("%c[PACKIT] %cstopping server", "color: #db2777",
                "color: #ffffff");
              if (!childProcess.exitCode) process.kill(-childProcess.pid);
            }
            process.exit()
          }
        })
      } else{
        if(globalThis?.process?.env) process.env.NODE_ENV = "production";
        if(globalThis?.Deno?.env) Deno.env.set("NODE_ENV", "production");
        packit(service, false);
      }
    });
}
