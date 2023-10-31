import NativeImport from "@reejs/imports/nativeImport.js";
import { Import } from "@reejs/imports/URLImport.js";
let fs = await NativeImport("node:fs");
let path = await NativeImport("node:path");
import SpecialFileImport from "@reejs/imports/specialFileImport.js";

export let readers = [
  {
    name: "pages",
    run: async glob => {
      return await glob("src/pages/**/*.{js,jsx,ts,tsx,md,mdx}", {
        ignore: ["src/pages/api/**/*.{js,ts}"],
      });
    },
  },
  {
    name: "components",
    run: async glob => {
      return await glob("src/components/**/*.{js,jsx,ts,tsx,md,mdx}");
    },
  },
  {
    name: "apis",
    run: async glob => {
      return await glob("src/pages/api/**/*.{js,ts}");
    },
  },
];

export let defaultTranspiler = async (fileURL, service, code) => {
  if (!service) throw new Error("parameter `service` is required");
  return await SpecialFileImport(fileURL, null, service, code);
};

export let transpilers = [
  {
    name: "tsx",
    run: defaultTranspiler,
  },
  {
    name: "ts",
    run: defaultTranspiler,
  },
  {
    name: "jsx",
    run: defaultTranspiler,
  },
  {
    name: "js",
    run: defaultTranspiler,
  },
  {
    name: "mdx",
    run: defaultTranspiler,
  },
  {
    name: "md",
    run: defaultTranspiler,
  },
];
let reejsSavedFilesCache = [], reejsSavedFilesServe = [], publicSavedFiles = [], chokidarStarted = 0, watchStaticFiles;
export let writers = [
  {
    name: "init",
    index: -100,
    describe: "Writes the necessary lines that initializes the Hono server",
    run: async (helpers, service) => {
      let pages = helpers.savedFiles.find(e => e.pages).pages;
      let components = helpers.savedFiles.find(e => e.components).components;
      let {
        TranspileFile,
        mainFile,
        processCwd,
        importmap,
        isDevMode,
        getPackage,
        config,
      } = helpers;
      if (service == "deno-deploy") {
        //deno now uses deno.json instead of import_maps.json bruh
        let denoimports = { ...importmap.imports };
        fs.writeFileSync(
          path.join("dist", "deno.json"),
          JSON.stringify({ imports: denoimports }, null, 2)
        );
        //delete packit/package.json if it exists
        if (fs.existsSync(path.join("dist", "package.json"))) {
          fs.unlinkSync(path.join("dist", "package.json"));
        }
      }
      //convert importmap.browserImports from {"react":"https://cdn.skypack.dev/react"} to {"../cache/<hash>":"https://cdn.skypack.dev/react"}
      let convertedBrowserImports = {};
      for (let key in Object.keys(importmap.browserImports)) {
        let keyForImport = Object.keys(importmap.browserImports)[key];
        convertedBrowserImports[
          (await getPackage(keyForImport)).replace("./.reejs", "/__reejs")
        ] =
          importmap.browserImports[Object.keys(importmap.browserImports)[key]];
        convertedBrowserImports[
          (await getPackage(keyForImport)).replace("./.reejs", "..")
        ] =
          importmap.browserImports[Object.keys(importmap.browserImports)[key]];
      }
      // add convertedBrowserImports to importmap.browserImports along with old importmap.browserImports
      importmap.browserImports = {
        ...convertedBrowserImports,
        ...importmap.browserImports,
      };

      let browserFn = pages.filter(page =>
        page.startsWith("src/pages/_browser")
      );
      let twindFn = await TranspileFile(
        pages.filter(page => page.startsWith("src/pages/_twind"))[0],
        service
      );
      let appFile = await TranspileFile(
        await getPackage("@reejs/react/app.jsx"),
        service
      );
      let debugFile;
      try {
        debugFile = await getPackage("react/debug");
      } catch (e) { }
      mainFile = `${isDevMode && service != "deno-deploy" && service !== "workers"
        ? `import "${await getPackage("@reejs/utils/log.js")}";`
        : ""
        }
      ${debugFile && isDevMode && !config.disablePreactCompat
          ? `import "${debugFile}";`
          : ""
        }
      ${(globalThis?.process?.env?.DEBUG ||
          globalThis?.Deno?.env?.get?.("DEBUG")) &&
          service !== "workers"
          ? `import { save } from "${await getPackage(
            "@reejs/imports/debug.js"
          )}";`
          : ""
        }
      ${twindFn?.length > 0
          ? `import inline from "${await getPackage(
            "@twind/with-react/inline"
          )}";
      import tw from "./.reejs/${twindFn.split(".reejs/")[1]}";`
          : ""
        }
      ${service == "node" || service == "bun" ? `import fs from "node:fs";` : ""
        }
      import ReeServer from "${await getPackage("@reejs/server")}";
      ${service == "deno-deploy"
          ? "import { serve } from 'https://deno.land/std/http/server.ts'"
          : ""
        }
      import { Hono } from "${await getPackage("hono")}";
      ${service == "workers"
          ? `import { serveStatic } from "${await getPackage(
            "hono/cloudflare-workers"
          )}"`
          : ""
        }
      ${service == "node" || service == "bun"
          ? `
      import { compress } from "${await getPackage("hono/compress")}";
      import { serve } from "${await getPackage("@hono/node-server")}";
      import { serveStatic } from "${await getPackage(
            "@hono/node-server/serve-static"
          )}"`
          : service === "deno-deploy"
            ? `import { serveStatic } from "https://deno.land/x/hono/middleware.ts";`
            : ""
        }
      ${config.disablePreactCompat
          ? `import {renderToString as render } from "${await getPackage(
            "react-dom/server"
          )}";`
          : `import render from "${await getPackage(
            "preact-render-to-string"
          )}";`
        }
      import React from "${await getPackage("react")}";
      import App from "./.reejs${appFile.split(".reejs")[1]}";
      const server = new ReeServer(Hono, {${service === "node" ? "serve," : ""
        }});
      server.app.onError(${(globalThis?.process?.env?.DEBUG ||
          globalThis?.Deno?.env?.get?.("DEBUG")) &&
          service !== "workers" &&
          service !== "workers"
          ? "save"
          : "console.log"
        })
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
      ${service === "node" ? `server.app.use('*',compress());` : ""}`;

      return {
        DATA: {
          pages,
          browserFn,
          twindFn,
          appFile,
          TranspileFile,
        },
        chunk: mainFile,
      };
    },
  },
  {
    name: "pages",
    index: 1,
    run: async (helpers, service) => {
      let { DATA, mainFile, importmap, isDevMode, getPackage, config } =
        helpers;
      let { pages, browserFn, twindFn, appFile, TranspileFile } = DATA;
      // we generate routes for pages here.
      pages = await Promise.all(
        pages.map(async page => {
          let route = page
            .replace("src/pages/", "")
            .replace("index", "")
            .replace(".tsx", "")
            .replace(".ts", "")
            .replace(".jsx", "")
            .replace(".js", "");
          if (route.startsWith("_")) return;
          // since * & ? are not allowed in file names, we will try to convert nextjs like routes to reejs like routes
          // /pages/[id].tsx => /pages/:id
          // /pages/[id]/[name].tsx => /pages/:id/:name
          // /pages/[[id]].tsx => /pages/:id?
          // /pages/[[...id]].tsx => /pages/*
          // /pages/[[...id]]/index.tsx => /pages/*
          // /pages/404.tsx => /pages/*

          let compiledRoute = route.trim().split("/");
          let is404 = false;
          compiledRoute = compiledRoute.map(r => {
            if (r.startsWith("[") && r.endsWith("]")) {
              if (r.startsWith("[[")) {
                return "*";
              } else if (r.startsWith("[...")) {
                return "*";
              } else {
                return ":" + r.replace("[", "").replace("]", "");
              }
            } else if (r.startsWith("404")) {
              is404 = true;
              return "*";
            } else {
              return r;
            }
          });
          compiledRoute = compiledRoute.join("/");
          //console.log(`[reejs] ${route} => ${compiledRoute}`);
          let code = fs.readFileSync(page, "utf-8");
          //use performant way to read the first line of a file
          let firstLine = code.split("\n")[0];
          let useClientDirective =
            firstLine.includes("'use client'") ||
            firstLine.includes('"use client"');
          let savedAt = await TranspileFile(page, service);
          let sha_name = savedAt.split("serve/")[1].split(".")[0];
          return {
            route: compiledRoute,
            page: page.trim(),
            savedAt,
            sha_name,
            useClientDirective,
          };
        })
      );
      pages = pages
        .filter(
          // remove undefined
          page => page !== undefined
        )
        .map(p => {
          return p;
        })
        .sort((a, b) => {
          // if a url ends with "*", it must be after the url that does not end with "*"
          // if both urls do not end with "*", the longer url must be after the shorter url
          //the longer route must be before the shorter route if both end with "*"
          // if both urls end with "*", the longer url must be before the shorter url
          if (a.route.endsWith("*") && !b.route.endsWith("*")) return 1;
          if (!a.route.endsWith("*") && b.route.endsWith("*")) return -1;

          if (a.route.length > b.route.length) return -1;
          if (a.route.length < b.route.length) return 1;

          if (a.route.endsWith("*") && b.route.endsWith("*")) {
            if (a.route.length > b.route.length) return -1;
            if (a.route.length < b.route.length) return 1;
          }
          return 0;
        });
      //generate routes file
      let routeData = `export default [${pages
        .map(({ route, page, savedAt }) => {
          if (route.endsWith("/")) route = route.slice(0, -1);
          return `{path: "/${route}", lazy: async() => {let h=await import("./${savedAt.split(".reejs/serve/")[1]
            }");return {Component:h.default,whole:h}}}`;
        })
        .join()}]`;
      //save file
      fs.writeFileSync(path.join(".reejs", "serve", "__routes.js"), routeData);

      //gs = generateScript; f = variable name for file like savedAt.split(".reejs/serve/")[1], c = use client directive
      mainFile += `\nconst gs=(f,c)=>'<reejs page="'+f+'"></reejs><script type="importmap">{"imports":${JSON.stringify(
        importmap.browserImports
      )}}</script><script type="module">${isDevMode && !config.disablePreactCompat
        ? 'await import("https://esm.sh/preact@10.16.0/debug");'
        : ""
        }${twindFn?.length > 0
          ? `(await import("https://esm.sh/@twind/core")).observe((await import("/__reejs/serve/1d9e2d.js")).default);`
          : ""
        }let i=(await import("/__reejs/serve/__reender.js")).default;await i("./serve/'+f+'",'+c+');</script>';`;
      mainFile +=
        '\nconst lr_=(s,t)=>`<link rel="preload" href="${s}" as="script" crossorigin>`';
      mainFile += `\nconst pre_=(n,f)=>n!="DoNotHydrate"?\`
      ${isDevMode && !config.disablePreactCompat
          ? '${lr_("https://esm.sh/preact@10.16.0/debug")}'
          : ""
        }
      ${twindFn?.length > 0 ? '${lr_("https://esm.sh/@twind/core")}' : ""}
      ${importmap.imports["react-router-dom"] &&
          importmap.imports["react-router-dom/server"]
          ? '${lr_("__reejs/serve/__routes.js")+lr_("' +
          importmap.browserImports["react-router-dom"] +
          '")+lr_("/__reejs/serve/17624b.js")}'
          : ""
        }
      \${lr_("/__reejs/serve/__reender.js")}\${lr_(\`__reejs/serve/\${f}\`)}
      </head>\`:"</head>"`;

      //init writing ./.reejs/utils/react-router and use it via defaultTranspiler if react-router is installed
      let rrPath;
      //create folder if not exists
      if (!fs.existsSync(path.join(".reejs", "utils"))) {
        fs.mkdirSync(path.join(".reejs", "utils"), { recursive: true });
      }
      if (
        importmap.imports["react-router-dom"] &&
        importmap.imports["react-router-dom/server"]
      ) {
        //write react-router.jsx
        let code = `import { createStaticRouter, StaticRouterProvider} from "${importmap.imports["react-router-dom/server"]}";
import { matchRoutes } from "${importmap.imports["react-router-dom"]}";
import _r from "../serve/__routes.js";
let routes = _r; //make it mutable

routes = await Promise.all(routes.map(async (r)=>{
  if(!r.lazy) return r;
  let {Component} = await r.lazy();
  delete r.lazy;
  return {...r, Component};
}));

export default function Body(props) {
  let router = createStaticRouter(routes, {
    basename: "/",
    location: new URL(props.children.props.c.req.url).pathname,
    matches: []
  });
  if(!props.App) throw new Error("\`App\` component is required for React Router.\\nThis usually means Packit is not generating correct code. Please report this issue on Github.");
  let App = props.App;
  //delete props.App;
  return <App {...props}>
    <StaticRouterProvider router={router} context={props.children.props.c.req} c={props.children.props.c} />
    </App>;
}`;

        if (!fs.existsSync(path.join(".reejs", "utils", "react-router.jsx"))) {
          fs.writeFileSync(
            path.join(".reejs", "utils", "react-router.jsx"),
            code
          );
        }
        rrPath = await defaultTranspiler(
          path.join(".reejs", "utils", "react-router.jsx"),
          service
        );
        mainFile += `\nimport RR_ from "./${rrPath}";`;
      }

      let reenderCode = `
      // this file is imported on browsers.
export default async function reender(page, useClientDirective) {
  let $ = (selector) => document.querySelector(selector);
  let $$ = (selector) => document.querySelectorAll(selector);
  let React;
  let p = (await import("/__reejs/serve/" + page.split("/")[2])).default;
  if (p.name == "DoNotHydrate") return;
  if (!React)
    React = (await import("react"));
  ${config.disablePreactCompat
          ? 'let { hydrateRoot, createRoot } = await import("react-dom/client");'
          : ""
        }
  ${importmap.imports["react-router-dom"] && config.disableReactRouter
          ? `
    let { createBrowserRouter, RouterProvider } = await import("react-router-dom");
    let routes = (await import("/__reejs/serve/__routes.js")).default; // this is generated by packit
    let Router = createBrowserRouter(routes);
    //TODO: use hydration without creating duplicate page
    ${config.disablePreactCompat
            ? 'hydrateRoot($("#root"), React.createElement(RouterProvider, { router: Router }));'
            : 'React.hydrate(React.createElement(RouterProvider, { router: Router }), $("#root"));'
          }
    //listen to url changes
    let Head = (await import("/__reejs/serve/17624b.js")).default; //@reejs/react/header.jsx
    Router.subscribe(d => {
      let r = d.matches[0];
      let choosen = r.route.whole;
      //create a fake hono context polyfill
      let req = {
        param: (s) => r.params[s],
      }
      let data = choosen?.generateMetadata?.({ req }) || choosen.metadata;
            ${config.disablePreactCompat
            ? 'hydrateRoot($("head"), React.createElement(Head, { data }));'
            : 'React.hydrate(React.createElement(Head, { data }), $("head"));'
          }
    });

  }
  `
          : `
    ${config.disablePreactCompat
            ? `
    if (useClientDirective) {
      (createRoot($("#root")).render(React.createElement(p)));
    }else{
    hydrateRoot($("#root"), React.createElement(p));
    }
    `
            : 'React.hydrate(React.createElement(p), $("#root"));'
          }
}`
        }
`;

      fs.writeFileSync(
        path.join(".reejs", "serve", "__reender.js"),
        reenderCode
      );

      pages = pages.map(
        ({ route, page, savedAt, sha_name, is404, useClientDirective }) => {
          if (route.endsWith("/")) route = route.slice(0, -1);
          mainFile += `\nimport * as file_${sha_name} from "./.reejs/${savedAt.split(".reejs/")[1]
            }";server.app.get("/${route == "" ? "" : route}",(c)=>{ ${is404 ? `c.status(404);` : ""
            }let h = "<!DOCTYPE html>"+render(React.createElement(${rrPath ? "RR_" : "App"
            },{${rrPath ? "App, " : ""}metadata: file_${savedAt.split("serve/")[1].split(".")[0]
            }.metadata || ((file_${savedAt.split("serve/")[1].split(".")[0]
            }?.generateMetadata)?file_${savedAt.split("serve/")[1].split(".")[0]
            }?.generateMetadata(c):{})},React.createElement(${useClientDirective}?React.Fragment:file_${savedAt.split("serve/")[1].split(".")[0]
            }.default,{${useClientDirective ? "" : "c"}})))
          .replace('<script id="__reejs"></script>',gs("${savedAt.split("serve/")[1]
            }",${useClientDirective})).replace('</head>',pre_(file_${sha_name}.default.name,"${savedAt.split("serve/")[1]
            }"));return ${twindFn?.length > 0
              ? "c.html(inline(h,tw).replaceAll('{background-clip:text}','{-webkit-background-clip:text;background-clip:text}'))"
              : //TODO: wait for twind to add vendor prefix for `background-clip:text`, then remove the replaceAll.
              "c.html(h)"
            }});`;
        }
      );
      DATA.pages = pages;
      return { chunk: mainFile, DATA };
    },
  },
  {
    name: "apis",
    index: -1,
    run: async (helpers, service) => {
      let { DATA, mainFile } = helpers;
      let apis = helpers.savedFiles.find(e => e.apis).apis;
      if (apis.length === 0) return { mainFile, DATA };
      await Promise.all(
        apis.map(async api => {
          let route = api
            .replace("src/pages/api/", "")
            .replace(".ts", "")
            .replace(".js", "")
            .replace("index", "");
          if (route.startsWith("_")) return;
          if (route.endsWith("/")) route = route.slice(0, -1);

          let savedAt = await helpers.TranspileFile(api, service);
          let sha_name = savedAt.split("serve/")[1].split(".")[0];
          mainFile += `\nimport * as file_${sha_name} from "./.reejs/${savedAt.split(".reejs/")[1]
            }";server.app.on((file_${sha_name}.method || "get"),"/api/${route}",file_${sha_name}.default);`;
        })
      );
      return { chunk: mainFile, DATA };
    },
  },
  {
    name: "static",
    index: 2,
    writeIndex: -1, //write before api & pages, but run after api & pages.
    run: async (helpers, service) => {
      let { DATA, mainFile, glob, pages, isDevMode, chokidar } = helpers;
      let { contentType } = await Import(
        "https://esm.sh/v132/mime-types@2.1.35",
        {
          internalDir: true,
        }
      );
      if (!isDevMode || !chokidar) {
        if (!reejsSavedFilesCache.length)
          reejsSavedFilesCache = await glob(".reejs/cache/**/*", {
            nodir: true,
          });
        if (!reejsSavedFilesServe.length)
          reejsSavedFilesServe = await glob(".reejs/serve/**/*", {
            nodir: true,
          });
        if (!publicSavedFiles.length)
          publicSavedFiles = await glob("public/**/*", { nodir: true });
      }
      if (chokidarStarted == 0 && isDevMode && chokidar) {
        chokidarStarted = 1;
        watchStaticFiles = chokidar.watch(["public/**/*", ".reejs/cache/**/*", ".reejs/serve/**/*"], {
        });
        watchStaticFiles.on("add", async (path) => {
          if (path.startsWith(".reejs/cache")) {
            reejsSavedFilesCache.push(path);
          } else if (path.startsWith(".reejs/serve")) {
            reejsSavedFilesServe.push(path);
          } else if (path.startsWith("public")) {
            publicSavedFiles.push(path);
          }
        });
        watchStaticFiles.on("unlink", async (path) => {
          if (path.startsWith(".reejs/cache")) {
            reejsSavedFilesCache = reejsSavedFilesCache.filter(e => e !== path);
          } else if (path.startsWith(".reejs/serve")) {
            reejsSavedFilesServe = reejsSavedFilesServe.filter(e => e !== path);
          } else if (path.startsWith("public")) {
            publicSavedFiles = publicSavedFiles.filter(e => e !== path);
          }
        });
      }

      let reejsSavedFilesString = "";
      if (service == "deno-deploy" || service == "node" || service == "bun") {
        //stringify reejsSavedFilesCache, reejsSavedFilesServe, publicSavedFiles and save it to reejsSavedFilesString
        let totalCacheFiles = { cache: reejsSavedFilesCache.map(e => e.replace(".reejs/cache/", "")).map(e => contentType(e) + "|" + e), serve: reejsSavedFilesServe.map(e => e.replace(".reejs/serve/", "")).map(e => contentType(e) + "|" + e), public: publicSavedFiles.map(e => e.replace("public/", "")).map(e => contentType(e) + "|" + e) };
        let totalCacheFilesString = JSON.stringify(totalCacheFiles);
        reejsSavedFilesString += `let total = ${totalCacheFilesString};\n`;
        reejsSavedFilesString += `total.cache.map(e => {const [t,f]=e.split("|");
          const _file = ${service == "node" || service == "bun" ? "fs.readFileSync" : "await Deno.readFile"}(\`.reejs/cache/\${f}\`);server.app.get(\`/__reejs/cache/\${f}\`, (c)=>{c.header('Content-type',t);return c.body(_file)})});`;
        reejsSavedFilesString += `total.serve.map(e => {const [t,f]=e.split("|");
          const _file = ${service == "node" || service == "bun" ? "fs.readFileSync" : "await Deno.readFile"}(\`.reejs/serve/\${f}\`);server.app.get(\`/__reejs/serve/\${f}\`, (c)=>{c.header('Content-type',t);return c.body(_file)})});`;
        reejsSavedFilesString += `total.public.map(e => {const [t,f]=e.split("|");
          const _file = ${service == "node" || service == "bun" ? "fs.readFileSync" : "await Deno.readFile"}(\`public/\${f}\`);server.app.get(\`/\${f}\`, (c)=>{c.header('Content-type',t);return c.body(_file)})});`;
      }
      mainFile += service == "deno-deploy" ||
        service == "node" ||
        service == "workers" ||
        service == "bun"
        ? reejsSavedFilesString
        : "";
      mainFile += "\nserver.app.get('/__reejs/*',(c)=>{return c.notFound()});";
      return { chunk: mainFile, DATA };
    },
  },
  {
    name: "finish",
    writeIndex: 100,
    describe:
      "Writes the necessary lines that starts the Hono server, based on what service you asked",
    run: async (helpers, service) => {
      let { mainFile, DATA } = helpers;
      mainFile += `\n${service === "node"
        ? 'server.listen(process.env.PORT || 3000, () => {console.log(`%c  ➜  %c🚆 : %chttp://localhost:${process.env.PORT || 3000}`,"color: #db2777","color: #6b7280","color: blue; font-weight: bold;")});'
        : ""
        }
${service == "workers" || service == "bun"
          ? 'console.log(`%c  ➜  %c 🚆 : %chttp://localhost:${process.env.PORT || 3000}`,"color: #db2777","color: #6b7280","color: blue; font-weight: bold;");\nexport default server.app;'
          : ""
        }
${service == "deno-deploy"
          ? 'serve(server.app.fetch,{port:Deno.env.get(\'PORT\') || 3000, onListen: ({port,hostname}) => {console.log(`%c  ➜  %c 🚆 : %chttp://localhost:${port}`,"color: #db2777","color: #6b7280","color: blue; font-weight: bold;")}})'
          : ""
        }
`;
      return { chunk: mainFile, DATA };
    },
  },
];

export let copyToPackit = [
  async (service, isDevMode, glob) => {
    let folders = isDevMode ? [] : ["public", ".reejs/serve", ".reejs/cache"];
    //use glob to get all files in folders
    let files = folders
      .map(folder => glob.sync(`./${folder}/**/*`, { nodir: true }))
      .flat();
    files = [
      ...files,
      ...(service == "deno-deploy"
        ? [".reecfg.json", "tailwind.config.js", "twind.config.js"]
        : [
          "package.json",
          "import_map.json",
          ".reecfg.json",
          "tailwind.config.js",
          "twind.config.js",
        ]),
    ];
    return { files, folders: [] };
  },
];
