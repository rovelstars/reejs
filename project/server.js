import { createServer } from "http";
import { createApp, send, createRouter, sendError, useQuery, appendHeader } from "h3";
import check from "./check.js";
import Import, { import_map } from "./import.js";
globalThis.Import = Import;
import fs from "fs";
import readConfig from "./readConfig.js";
import { promisify } from "util";
import path, { resolve } from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { homedir, platform } from "os";
let app, listen;
if (check) {
  let home = homedir();
  let os = platform();
  let homewin;
  if (os == "win32") {
    homewin = home;
    home = home.replace(/\\/g, "/");
  }
  let dir = `${home}/.reejs`;
  const readdir = promisify(fs.readdir);
  const stat = promisify(fs.stat);

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
    files = files.map((f) => f.replace(`${process.cwd()}/src/pages/`, "")).filter((f) => f.endsWith(".js") || f.endsWith(".ts"));
    if (api) {
      files = files.filter((f) => f.startsWith("api/"));
    }
    if (!api) {
      files = files.filter((f) => !f.startsWith("api/"));
    }
    let results = [];
    for (let file in files) {
      results[file] = await Import(`${process.platform=="win32"?"file://":`${process.cwd()}/src/pages/`}${files[file]}`);
    }
    return Object.keys(results).map((route) => {
      let path = `/src/pages/${files[route]}`;
      let pathReg = path
        .replace(/\/src\/pages|index|\.|ts|js$/g, "")
        .replace(/\[\.{3}.+\]/, "*")
        .replace(/\[(.+)\]/, ":$1");
        if(process.platform=="win32"){
          pathReg = pathReg.replace(`${process.cwd()}\\src\\pages\\`,"").replaceAll("\\","/");
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

  let cfg = fs.readFileSync(`${process.cwd()}/.reecfg`, "utf-8").split("\n");
  let system = readConfig(cfg, "system");
  let renderType = readConfig(cfg, "render");
  globalThis.isProd = readConfig(cfg, "env") == "dev" ? false : true;
  if (isProd) {
    globalThis.consoleProdLog = console.log;
    console.log = () => { };
  }
  let shouldCheckRoutes = readConfig(cfg, "check") == "true";
  app = createApp();
  let wasListening = false;
  listen = (port) => {
    if (!wasListening) {
      console.log(`[SERVER] Listening on ${port}`);
      if (isProd) consoleProdLog(`[SERVER] Listening on ${port}`);
      createServer(app).listen(parseInt(port));
      wasListening = port;
    }
  };

  globalThis.__hash = hash();
  app.use("*", (req, res, next) => {
    if (!req.url.startsWith("/__reejs/")) {
      console.log(`[SERVER] GET -> ${req.url}`)
    };
    next();
  });
  console.log("[SERVER] Rendering with Hybrid Mode");
  (async () => {
    let router = createRouter();
    let pages = await genPages();
    let apis = await genPages(true);
    router.get("/routes", async (req, res) => {
      return { pages, apis };
    });
    router.get("/hash", (req, res) => {
      return __hash;
    })
    router.get("/assets/*", async (req, res, next) => {
      let file = req.url.replace("/assets/", "").split("?")[0];
      let filepath = `${dir}/project/csr/${file}`;
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
          return send(res, fs.readFileSync(filepath));
        } catch (e) {
          console.log("Failure", e);
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
      let filepath = `${process.cwd()}${file}`;
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
            //cache file
            cacheFiles.push({ filepath, data });
            return send(res, data);
          }
        } catch (e) { next(); }
      }
      else {
        next();
      }
    });
    app.use("/__reejs", router);
  })();

  if (system == "react") {
    let react = fs.readFileSync(`${dir}/project/systems/react.js`, "utf-8");
    eval(`${react}\n//# sourceURL=${`${dir}/project/systems/react.js`}`);
  }
}
export default { app, listen };