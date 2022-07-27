import { createServer } from "http";
import { createApp, send, createRouter, sendError } from "h3";
import check from "./check.js";
import Import from "./import.js";
globalThis.Import = Import;
import fs from "fs";
import readConfig from "./readConfig.js";
import { promisify } from "util";
import path, { resolve } from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { homedir, platform } from "os";
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
    results[file] = await Import(`${process.cwd()}/src/pages/${files[file]}`);
  }
  return Object.keys(results).map((route) => {
    let path = `/src/pages/${files[route]}`;
    path = path
      .replace(/\/src\/pages|index|\.|ts|js$/g, "")
      .replace(/\[\.{3}.+\]/, "*")
      .replace(/\[(.+)\]/, ":$1");
    let obj;
    if (!api) {
      obj = { path, component: results[route] };
    }
    if (api) {
      obj = { path, router: results[route] };
    }
    return obj;
  });
}

let cfg = fs.readFileSync(`${process.cwd()}/.reecfg`, "utf-8").split("\n");
let system = readConfig(cfg, "system");
globalThis.CACHE_FILES = readConfig(cfg, "env") == "dev" ? false : true;
if (CACHE_FILES) console.log = () => { };
let shouldCheckRoutes = readConfig(cfg, "check") == "true";
const app = createApp();
let wasListening = false;
let listen = (port) => {
  if (!wasListening) {
    console.log(`[SERVER] Listening on ${port}`);
    createServer(app).listen(parseInt(port));
    wasListening = port;
  }
};

export default { app, listen };

if (check) {
  if (system == "react") {
    let react = fs.readFileSync(`${dir}/project/systems/react.js`, "utf-8");
    eval(`${react}\n//# sourceURL=${`${dir}/project/systems/react.js`}`);
  }
}