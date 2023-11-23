import Import from "@reejs/imports";
export function defineConfig(config) {
  config.disablePackitStartupLog = true;
  config.clearScreen = false;
  config.disableDefaults = {};
  config.disablePreactCompat = true;
  config.fakeVite = true;
  config.writers = config.writers || [];
  config.writers.push(
    {
      name: "vite",
      index: -100,
      describe: "Starts vite writer for packit",
      run: async (helpers, service) => {
        let { importmap, getPackage } = helpers;
        if (
          !helpers.fs.existsSync(
            helpers.path.join(helpers.processCwd, "index.html")
          )
        ) {
          console.log(
            "%c  ➜  %cNo index.html found. Please create one at the root directory to continue.",
            "color: green",
            "color: red"
          );
          return;
        }
        const html = helpers.fs.readFileSync(
          helpers.path.join(helpers.processCwd, "index.html"),
          "utf-8"
        );
        const $ = cheerio.load(html);
        //select all script tags with src and type=module
        const scripts = $("script")
          .filter((i, el) => el.attribs.src && el.attribs.type === "module")
          .map((i, el) => el.attribs.src)
          .get();
        //loop through all script tags and transpile them
        for (const script of scripts) {
          const path = helpers.path.join(helpers.processCwd, script);
          const savedAt = await helpers.TranspileFile(path, service);
          $(`script[src="${script}"]`).attr(
            "src",
            "/__reejs" + savedAt.split(".reejs")[1]
          );
        }
        //convert importmap.browserImports from {"react":"https://cdn.skypack.dev/react"} to {"../cache/<hash>":"https://cdn.skypack.dev/react"}
        let convertedBrowserImports = {};
        for (let key in Object.keys(importmap.browserImports)) {
          let keyForImport = Object.keys(importmap.browserImports)[key];
          convertedBrowserImports[
            (await getPackage(keyForImport)).replace("./.reejs", "/__reejs")
          ] =
            importmap.browserImports[
              Object.keys(importmap.browserImports)[key]
            ];
          convertedBrowserImports[
            (await getPackage(keyForImport)).replace("./.reejs", "..")
          ] =
            importmap.browserImports[
              Object.keys(importmap.browserImports)[key]
            ];
        }
        // add convertedBrowserImports to importmap.browserImports along with old importmap.browserImports
        importmap.browserImports = {
          ...convertedBrowserImports,
          ...importmap.browserImports,
        };
        //add a new script for importmaps, at the head element
        $("head").append(
          `<script type="importmap">{"imports":${JSON.stringify(
            importmap.browserImports
          )}}</script>`
        );
        helpers.fs.writeFileSync(
          helpers.path.join(helpers.cwd, ".reejs", "serve", "index.html"),
          $.html()
        );
      },
    },
    {
      name: "vite-serve",
      index: -99,
      describe: "Starts vite server for packit",
      run: async (helpers, service) => {
        let { getPackage } = helpers;
        return {
          mainFile: `import {Hono} from "${await getPackage("hono")}";
        import { serve } from "${await getPackage("@hono/node-server")}";
        const app = new Hono({ strict: false });
        import { serveStatic } from "${await getPackage(
          "@hono/node-server/serve-static"
        )}";
        import fs from "node:fs";
`,
        };
      },
    },
    {
      name: "static",
      index: -98,
      run: async (helpers, service) => {
        let { DATA, mainFile, glob } = helpers;
        let { contentType } = await Import("v132/mime-types@2.1.35", {
          internalDir: true,
        });
        let reejsSavedFilesCache = await glob(".reejs/cache/**/*", {
          nodir: true,
        });
        let reejsSavedFilesServe = await glob(".reejs/serve/**/*", {
          nodir: true,
        });
        let publicSavedFiles = await glob("public/**/*", { nodir: true });
        let reejsSavedFilesString = "";
        if (service == "deno-deploy" || service == "node") {
          reejsSavedFilesString =
            reejsSavedFilesCache
              .map(file => {
                return `let cache_${file
                  .replace(".reejs/cache/", "")
                  .replaceAll(":", "")
                  .replaceAll("-", "")
                  .replaceAll(".", "")
                  .replaceAll("/", "")} = ${
                  service == "node" ? "fs.readFileSync" : "await Deno.readFile"
                }("${file}");app.get("/__reejs/cache/${file.replace(
                  ".reejs/cache/",
                  ""
                )}", (c)=>{c.header('Content-type','${contentType(
                  file.replaceAll("/", "")
                )}');return c.body(cache_${file
                  .replace(".reejs/cache/", "")
                  .replaceAll(":", "")
                  .replaceAll("-", "")
                  .replaceAll(".", "")
                  .replaceAll("/", "")})});`;
              })
              .join("\n") +
            reejsSavedFilesServe
              .map(file => {
                if (
                  !file
                    .replace(".reejs/serve/", "")
                    .replace("loaders/", "")
                    .includes(".")
                )
                  return "";
                return `let serve_${file
                  .replace(".reejs/serve/", "")
                  .replace("loaders/", "")
                  .replaceAll(":", "")
                  .replaceAll("-", "")
                  .replaceAll(".", "")
                  .replaceAll("/", "")
                  .replaceAll("-", "_")} = ${
                  service == "node" ? "fs.readFileSync" : "await Deno.readFile"
                }("${file}");app.get("/__reejs/serve/${file.replace(
                  ".reejs/serve/",
                  ""
                )}", (c)=>{c.header('Content-type','${contentType(
                  file.replaceAll("/", "")
                )}');return c.body(serve_${file
                  .replace(".reejs/serve/", "")
                  .replace("loaders/", "")
                  .replaceAll(":", "")
                  .replaceAll("-", "")
                  .replaceAll(".", "")
                  .replaceAll("/", "")})});`;
              })
              .join("\n") +
            publicSavedFiles
              .map(file => {
                return `let ${file
                  .replaceAll("/", "__")
                  .replaceAll(".", "")
                  .replaceAll("-", "_")} = ${
                  service == "node" ? "fs.readFileSync" : "await Deno.readFile"
                }("${file}");app.get("${file.slice(
                  file.indexOf("/", 2)
                )}",(c)=>{c.header('Content-type','${contentType(
                  file.replaceAll("/", "")
                )}');return c.body(${file
                  .replaceAll("/", "__")
                  .replaceAll(".", "")
                  .replaceAll("-", "_")})});`;
              })
              .join("\n");
        }
        mainFile +=
          service !== "node" && service !== "workers" //todo: make a custom serveStatic myself.
            ? "app.get('/__reejs/**',serveStatic({root:'./__reejs/',rewriteRequestPath:(p)=>p.replace('/__reejs','')}));app.get('/**',serveStatic({root:'./public',rewriteRequestPath:(p)=>p.replace('/public','')}));"
            : service == "deno-deploy" ||
                service == "node" ||
                service == "workers"
              ? reejsSavedFilesString
              : "";
        mainFile += "\napp.get('/__reejs/*',(c)=>{return c.notFound()});";
        mainFile +=
          "app.get('/',(c)=>{c.header('Content-type','text/html');return c.body(fs.readFileSync('./.reejs/serve/index.html'))});";
        return { mainFile, DATA };
      },
    },
    {
      name: "end",
      index: 0,
      describe: "burh",
      run: async (helpers, service) => {
        return {
          mainFile:
            helpers.mainFile +
            `serve({
          fetch: app.fetch,
          port: process.env.PORT || 3000,
        });`,
        };
      },
    }
  );
  if (process.argv.includes("-d") || process.argv.includes("--dev")) {
    console.clear();
    console.log("");
    console.log(
      `%c  VITE %cready in %c${
        Date.now() - (globalThis?.VITE_PLUGIN_STARTED || Date.now() - 1)
      } %cms`,
      "color: green; font-weight: bold;",
      "color: gray;",
      "color: white; font-weight: bold;",
      "color: gray;"
    );
    console.log("");
    console.log(
      `%c  ➜  %cLocal:%c http://localhost:%c${process.env.PORT || 3000}`,
      "color: green",
      "font-weight: bold",
      "color: blue",
      "color: blue; font-weight: bold"
    );
    console.log(
      `%c  ➜  %cNetwork:%c use %c--host %cto expose`,
      "color: green",
      "font-weight: bold; color: gray",
      "color: gray",
      "font-weight: bold",
      "color: gray"
    );
    console.log(
      "%c  ➜  %cpress%c h %cto show help",
      "color: green",
      "color: gray",
      "color: white",
      "color: gray"
    );
  } else {
    console.log(
      "%cvite %cbuilding for production...",
      "color: blue",
      "color: green"
    );
  }
  return config;
}
