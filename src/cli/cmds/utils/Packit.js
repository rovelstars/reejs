import NativeImport from "@reejs/imports/nativeImport.js";
import { Import } from "@reejs/imports/URLImport.js";
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
    let apisDir = path.join(".", "src", "pages", "api");
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
    "name": "init",
    "describe": "Writes the necessary lines that initializes the Hono server",
    "run": async (helpers, service) => {
      let pages = helpers.savedFiles.find(e => e.pages).pages;
      let components = helpers.savedFiles.find(e => e.components).components;
      await Promise.all(components.map(async(c)=>{
        await SpecialFileImport(c, null, service);
      }))
      let { TranspileFile, mainFile, processCwd, importmap, isDevMode, getPackage } = helpers;
      if (service == "deno-deploy") {
        //deno now uses deno.json instead of import_maps.json bruh
        let denoimports = Object.assign({}, importmap.imports, {
          "@reejs/": "./node_modules/@reejs/",
        });
        fs.writeFile(path.join("packit", "deno.json"), JSON.stringify({ imports: denoimports }, null, 2), () => { });
        //delete packit/package.json if it exists
        if (fs.existsSync(path.join("packit", "package.json"))) {
          fs.unlinkSync(path.join("packit", "package.json"));
        }
      }
      //convert importmap.browserImports from {"react":"https://cdn.skypack.dev/react"} to {"../cache/<hash>":"https://cdn.skypack.dev/react"}
      let convertedBrowserImports = {};
      for (let key in Object.keys(importmap.browserImports)) {
        let keyForImport = Object.keys(importmap.browserImports)[key];
        convertedBrowserImports[getPackage(keyForImport).replace("./.reejs", "/__reejs")] = importmap.browserImports[Object.keys(importmap.browserImports)[key]];
        convertedBrowserImports[getPackage(keyForImport).replace("./.reejs", "..")] = importmap.browserImports[Object.keys(importmap.browserImports)[key]];
      }
      // add convertedBrowserImports to importmap.browserImports along with old importmap.browserImports
      importmap.browserImports = {
        ...convertedBrowserImports,
        ...importmap.browserImports,
      };
      let reenderFile = (await SpecialFileImport(path.join(
        processCwd, "node_modules", "@reejs", "react", "reender.js")));
      let reender = "/__reejs" + reenderFile.split(".reejs")[1];
      let browserFn = pages.filter((page) => page.startsWith("src/pages/_browser"));
      let twindFn = await TranspileFile(pages.filter((page) => page.startsWith("src/pages/_twind"))[0]);
      let appFile = await TranspileFile(pages.find((page) => page.startsWith("src/pages/_app")));
      mainFile = `${(isDevMode && service != "deno-deploy") ? "import './node_modules/@reejs/utils/log.js';" : ""}
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
      import { Hono } from "${getPackage("hono")}";
      import { compress } from "${getPackage("hono/compress")}";
      ${service === "node" ? `
      import { serve } from "${getPackage("@hono/node-server")}";
      import { serveStatic } from "${getPackage("@hono/serve-static")}"`
          : `import { serveStatic } from "https://deno.land/x/hono/middleware.ts";`}
      import render from "${getPackage("render")}";
      import React from "${getPackage("react")}";
      import App from "./.reejs${appFile.split(".reejs")[1]}";
      const server = new ReeServer(Hono, {${service === "node" ? "serve," : ""}});
      server.app.onError(console.log);
      const headMethod = ({ app }) => {
        return async (c, next) => {
          if (c.req.method === 'HEAD') {
            const res = await app.fetch(
              new Request(c.req.url, {
                ...c.req.raw,
                method: 'GET',
              })
            )
            return new Response(null, res)
          }
          await next()
        }
      }
      server.app.use('*',headMethod({ app: server.app }));
      server.app.use('*',compress());`;

      return {
        DATA: {
          pages, reender, browserFn, twindFn, appFile, TranspileFile
        },
        mainFile
      }
    }
  },
  {
    "name": "pages",
    "run": async (helpers, service) => {
      let { DATA, mainFile, importmap, isDevMode } = helpers;
      let { pages, reender, browserFn, twindFn, appFile, TranspileFile } = DATA;
      // we generate routes for pages here.
      await Promise.all(pages.map(async (page) => {
        let route = page.replace("src/pages/", "")
          .replace("index", "")
          .replace(".tsx", "")
          .replace(".ts", "")
          .replace(".jsx", "")
          .replace(".js", "");
        if (route.startsWith("_")) return;
        if (route.endsWith("/")) route = route.slice(0, -1);
        let savedAt = await TranspileFile(page);
        let sha_name = savedAt.split("serve/")[1].split(
          ".")[0];
        mainFile += `\nimport file_${sha_name} from "./.reejs/${savedAt.split(".reejs/")[1]}";server.app.get("${route == "" ? "" : `/${route}`}",(c)=>{ let h = "<!DOCTYPE html>"+render(React.createElement(App,null,React.createElement(file_${savedAt.split("serve/")[1].split(".")
        [0]},null))).replace('<script id="__reejs"></script>','<reejs page="${savedAt.split("serve/")[1]}"></reejs><script type="importmap">{"imports":${JSON.stringify(
          importmap
            .browserImports)}}</script><script type="module">${isDevMode
              ? 'await import("https://esm.sh/preact@10.13.2/debug");'
              : ''}let i=(await import("${reender}")).default;i("./${savedAt.split(".reejs/")[1]}",${browserFn.length > 0 ? `"${browserFn[0][1].replace('.reejs', '/__reejs')}"`
                : 'null'});</script>');return ${twindFn?.length > 0 ? "c.html(inline(h,tw).replaceAll('{background-clip:text}','{-webkit-background-clip:text;background-clip:text}'))"
                  //TODO: wait for twind to add vendor prefix for `background-clip:text`, then remove the replaceAll.
                  : "c.html(h)"}});`;
      }));
      return { mainFile, DATA };
    }
  },
  {
    name: "apis",
    run: async (helpers, service) => {
      let { DATA, mainFile } = helpers;
      let apis = helpers.savedFiles.find(e => e.apis).apis;
      if (apis.length === 0) return { mainFile, DATA };
      await Promise.all(apis.map(async (api) => {
        let route = api.replace("src/pages/api/", "")
          .replace(".ts", "")
          .replace(".js", "")
          .replace("index", "");
        if (route.startsWith("_")) return;
        if (route.endsWith("/")) route = route.slice(0, -1);

        let savedAt = await helpers.TranspileFile(api);
        let sha_name = savedAt.split("serve/")[1].split(
          ".")[0];
        mainFile += `\nimport file_${sha_name} from "./.reejs/${savedAt.split(".reejs/")[1]}";server.app.get("/api${route}",file_${sha_name});`;
      }));
      return { mainFile, DATA };
    }
  },
  {
    name: "static",
    run: async (helpers, service) => {
      let { DATA, mainFile } = helpers;
      let { contentType } = await Import("mime-types@2.1.35");
      let reejsSavedFilesCache = fs.readdirSync(path.join(".reejs", "cache"));
      let reejsSavedFilesServe = fs.readdirSync(path.join(".reejs", "serve"));
      let publicSavedFiles = getFiles("public");
      let reejsSavedFilesString = "";
      if (service == "deno-deploy" || service == "node") {
        reejsSavedFilesString =
          reejsSavedFilesCache
            .map((file) => {
              return `let cache_${file.replace(".", "")} = ${service == "node" ? "fs.readFileSync" : "await Deno.readFile"}("./.reejs/cache/${file}");server.app.get("/__reejs/cache/${file}", (c)=>{c.header('Content-type','${contentType(file)
                }');return c.body(cache_${file.replace(".", "")})});`;
            })
            .join("\n") +
          reejsSavedFilesServe
            .map((file) => {
              return `let serve_${file.replace(".", "")} = ${service == "node" ? "fs.readFileSync" : "await Deno.readFile"}("./.reejs/serve/${file}");server.app.get("/__reejs/serve/${file}", (c)=>{c.header('Content-type','${contentType(file)
                }');return c.body(serve_${file.replace(".", "")})});`;
            })
            .join("\n") +
          publicSavedFiles.map((file) => {
            return `let public_${file.replaceAll("/", "__").replaceAll(".", "")} = ${service == "node" ? "fs.readFileSync" : "await Deno.readFile"}("${file}");server.app.get("${file.slice(file.indexOf("/", 2))}",(c)=>{c.header('Content-type','${contentType(file)
              }');return c.body(public_${file.replaceAll("/", "__").replaceAll(".", "")})});`;
          }).join("\n");
      }
      mainFile += (service !== "node") //todo: make a custom serveStatic myself.
        ? "server.app.get('/__reejs/**',serveStatic({root:'./__reejs/',rewriteRequestPath:(p)=>p.replace('/__reejs','')}));server.app.get('/**',serveStatic({root:'./public',rewriteRequestPath:(p)=>p.replace('/public','')}));"
        : (((service == "deno-deploy") || (service == "node")) ? reejsSavedFilesString : "");
      return { mainFile, DATA };
    }
  },
  {
    name: "finish",
    describe: "Writes the necessary lines that starts the Hono server, based on what service you asked",
    run: async (helpers, service) => {
      let { mainFile, DATA } = helpers;
      mainFile += `\n${service === "node"
        ? "server.listen(process.env.PORT || 3000, () => {console.log(`%c  ➜  %c🚆 :%chttp://localhost:${process.env.PORT || 3000}`,\"color: #db2777\",\"color: #6b7280\",\"color: blue; font-weight: bold;\")});"
        : ""}
${service == "workers" ? "export default server.app;" : ""}
${service == "deno-deploy" ? "serve(server.app.fetch,{port:Deno.env.get('PORT') || 3000, onListen: ({port,hostname}) => {console.log(`%c  ➜  %c 🚆 : %chttp://localhost:${port}`,\"color: #db2777\",\"color: #6b7280\",\"color: blue; font-weight: bold;\")}})" : ""}
`;
      return { mainFile, DATA };
    }
  }
]

export let copyToPackit = [
  (service) => {
    return {
      files: [
        //dont add package.json if service is deno-deploy
        ...(service == "deno-deploy" ? [] : ["package.json"]),
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
  }
];
