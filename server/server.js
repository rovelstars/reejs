import { createServer } from "../utils/http.js";
import check from "./check.js";
import Import, { import_map } from "./import.js";
import "../polyfill/process.js";
let import_maps = import_map.imports;
globalThis.Import = Import;
let { createApp, send, createRouter, useQuery, appendHeader, setHeader, sendError, createError } = await Import(import_maps["h3"]);
import fs from "../utils/fs.js";
import readConfig from "./readConfig.js";
import { promisify } from "../utils/util.js";
import path, { resolve } from "../utils/path.js";
import { fileURLToPath } from "../utils/url.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { homedir, platform } from "../utils/os.js";
import HTTPCat from "./statusCats.js";
let app;
let cfg = fs.readFileSync(`${process.cwd()}/.reecfg`, "utf-8").split("\n");
//generate hash that is unique everytime
let hash = () => {
  let text = "";
  let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 5; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  text += "_";
  for (let i = 0; i < 5; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
}
let twind, twindSSR = readConfig(cfg, "twindSSR") == "true" ? true : false;
if (twindSSR) {
  console.log("[TWIND] Enabled!");
  twind = await Import(import_maps["twind"]);
  let presetTW = await Import(import_maps["@twind/preset-tailwind"]);
  twind.setup({
    /* config */
    presets: [presetTW]
  });
}
globalThis.__hash = hash();
let initServer = async (port) => {
  if (check) {
    let home = homedir();
    let os = platform();
    let homewin;
    if (os == "win32") {
      homewin = home;
      home = home.replace(/\\/g, "/");
    }
    let dir = fs.existsSync(process.env.REEJS_CUSTOM_DIR) ? process.env.REEJS_CUSTOM_DIR : `${home}/.reejs`;
    const readdir = promisify(fs.readdir);
    const stat = promisify(fs.stat);

    async function getFiles(dir) {
      const subdirs = await readdir(dir);
      const files = await Promise.all(
        subdirs.map(async (subdir) => {
          const res = resolve(dir, subdir);
          return (await stat(res)).isDirectory() ? getFiles(res) : res;
        })
      );
      return files.reduce((a, f) => a.concat(f), []);
    }
    let genPages = async (api = false) => {
      let files = await getFiles(`${process.cwd()}/src/pages`);
      files = files.map((f) => f.replace(`${process.cwd()}/src/pages/`, "")).filter((f) => f.endsWith(".js") || f.endsWith(".jsx") || f.endsWith(".ts") || f.endsWith(".tsx"));
      if (api) {
        files = files.filter((f) => f.startsWith("api/"));
      }
      if (!api) {
        files = files.filter((f) => !f.startsWith("api/"));
      }
      let results = [];
      for (let file in files) {
        results[file] = await Import(`${process.platform == "win32" ? "file://" : `${process.cwd()}/src/pages/`}${files[file]}`);
      }
      return Object.keys(results).map((route) => {
        let path = `/src/pages/${files[route]}`;
        let pathReg = path
          .replace(/\/src\/pages|index|\.tsx|\.jsx|\.ts|\.js$/g, "");
        pathReg = pathReg
          .replace(/\[\.{4}\w+\]/, "**")
          .replace(/\[\.{3}\w+\]/, "*")
          .replace(/\[(.+)\]/, ":$1");
        if (process.platform == "win32") {
          pathReg = pathReg.replace(`${process.cwd()}\\src\\pages\\`, "").replaceAll("\\", "/");
          path.replace(`${process.cwd()}\\src\\pages\\`, "").replaceAll("\\", "/");
        }
        let obj;
        if (!api) {
          obj = { path: pathReg, component: results[route], file: path };
        }
        if (api) {
          obj = { path: pathReg, router: results[route], file: path };
        }
        return obj;
      });
    }

    let system = readConfig(cfg, "system");
    let mode = readConfig(cfg, "mode");
    let renderType = readConfig(cfg, "render");
    globalThis.isProd = readConfig(cfg, "env") == "dev" ? false : true;
    let shouldMinify = readConfig(cfg, "minify") == "true" ? true : false;
    let terser;

    if (shouldMinify) {
      console.log("[MINIFY] Enabled!");
      terser = await Import("https://esm.sh/terser@5.14.2");
    }
    if (isProd) {
      globalThis.consoleProdLog = console.log;
      console.log = async () => { };
    }
    let shouldCheckRoutes = readConfig(cfg, "check") == "true";
    app = createApp();
    let wasListening = false;
    if (!wasListening) {
      init();
      console.log(`[SERVER] Listening on ${port}`);
      if (isProd) consoleProdLog(`[SERVER] Listening on ${port}`);
      createServer(app).listen(parseInt(port));
      wasListening = port;
    }


    if (!isProd) {
      app.use("*", async (req, res, next) => {
        if (!req.url.startsWith("/__reejs/")) {
          console.log(`[SERVER] GET -> ${req.url}`)
        };
        next();
      });
    }
    app.use(async (req, res, next) => {
      //add header server software
      setHeader(res, "Server", "ReeST");
      next();
    });
    async function init() {
      let router = createRouter();
      let pages = await genPages();
      let apis = await genPages(true);
      router.get("/routes", async (req, res) => {
        return { pages, apis };
      });
      router.get("/hash", async (req, res) => {
        return __hash;
      })
      let cacheAssets = [];
      router.get("/assets/**", async (req, res, next) => {
        let file = req.url.replace("/assets/", "").split("?")[0];
        let filepath = `${dir}/server/csr/${file}`;
        if (fs.existsSync(filepath)) {
          try {
            //generate mime type
            let mime = file.split(".").pop();
            if (mime == "css") {
              mime = "text/css";
            }
            if (mime == "js") {
              mime = "application/javascript";
            }
            //send mime type header
            appendHeader(res, "Content-Type", mime);
            appendHeader(res, "Cache-Control", "public, max-age=31536000"); // 1 year
            if (cacheAssets.findIndex((d) => { return d.filepath == filepath }) != -1) {
              return send(res, cacheAssets[cacheAssets.findIndex((d) => { return d.filepath == filepath })].data);
            }
            else {
              let data = fs.readFileSync(filepath, "utf-8");
              if (shouldMinify && filepath.endsWith(".js")) {
                let minified = await terser.minify(data, {
                  module: true,
                  compress: {},
                  mangle: {},
                  output: {},
                  parse: {},
                  rename: {},
                });
                data = minified.code;
              }
              cacheAssets.push({ filepath, data });
              return send(res, data);
            }
          } catch (e) {
            console.log("Error:", e);
            if (isProd) consoleProdLog("Error:", e);
            next();
          }
        }
        else {
          console.log("File not found", filepath);
          next();
        }
      });

      let cacheFiles = [];
      router.get("/src", async (req, res, next) => {
        let file = useQuery(req).file;
        let filepath = file.replace("/src/pages/", "");
        if (process.platform != "win32") {
          filepath = `${process.cwd()}${file}`;
        }
        if (fs.existsSync(filepath)) {
          try {
            //generate mime type
            let mime = file.split(".").pop();
            if (mime == "css") {
              mime = "text/css";
            }
            if (mime == "js") {
              mime = "application/javascript";
            }
            //send mime type header
            appendHeader(res, "Content-Type", mime);
            appendHeader(res, "Cache-Control", "public, max-age=31536000"); // 1 year
            //check if file is cached
            if (cacheFiles.findIndex((d) => { return d.filepath == filepath }) != -1) {
              return send(res, cacheFiles[cacheFiles.findIndex((d) => { return d.filepath == filepath })].data);
            }
            else {
              let data = fs.readFileSync(filepath, "utf-8");
              data = data.replace(/\/\* REEJS_SERVER_SIDE_START \*\/[\s\S]*\/\* REEJS_SERVER_SIDE_END \*\//g, "");
              if (shouldMinify && filepath.endsWith(".js")) {
                let minified = await terser.minify(data, {
                  module: true,
                  compress: {},
                  mangle: {},
                  output: {},
                  parse: {},
                  rename: {},
                });
                data = minified.code;
              }
              cacheFiles.push({ filepath, data });
              return send(res, data);
            }
          } catch (e) {
            console.log("Error:", e);
            if (isProd) consoleProdLog("Error:", e);
            next();
          }
        }
        else {
          next();
        }
      });
      if (!isProd) {
        router.get("/status/:code", async (req, res) => {
          let code = req.context.params.code;
          code = parseInt(code);
          if (code > 300) res.statusCode = code;
          return HTTPCat(code);
        });
      }

      app.use("/__reejs", router);
      if (system == "react") {
        let react = fs.readFileSync(`${dir}/server/systems/react.js`, "utf-8");
        eval(`${react}\n//# sourceURL=${`${dir}/server/systems/react.js`}`);
      }
    };
  }
}
let Listen = async (port) => {
  await initServer(port);
}
let polyfills = await Import("./polyfills.js");
let { h, Component, render } = await Import("preact");
let htm = await Import("htm");
let html = htm.bind(h);
polyfills = polyfills({
  hash: globalThis.__hash,
  html,
  reeact: await Import("preact"),
  twind,
  opts: { env: readConfig(cfg, "env") },
  import_maps,
  routes: [],
  router: {},
  pageUrl: ""
});
export default { app, listen: Listen, polyfills };