#!/usr/bin/env node
import { fileURLToPath } from "./utils/url.js";
import importESM_sh from "./utils/urlimports.js";
import Import from "./server/import.js";
import "./polyfill/process.js";
let sade = await importESM_sh("https://esm.sh/sade?target=node");
sade = await import(sade);
sade = sade.default;
import color from "./utils/colors.js";
import { exec, spawn, execSync } from "child_process";
import { get } from "https";
import fs from "./utils/fs.js";
import { promisify } from "./utils/util.js";
import path, { resolve } from "./utils/path.js";
import readConfig from "./utils/readConfig.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pkg = JSON.parse(fs.readFileSync(`${__dirname}/package.json`, "utf8"));
import { homedir, platform } from "os";
if (!process.env.REEJS_CUSTOM_DIR) {
  process.env.REEJS_CUSTOM_DIR = __dirname;
}
const originalEmit = process.emit;
process.emit = function (name, data, ...args) {
  if (
    name === `warning` &&
    typeof data === `object` &&
    data.name === `ExperimentalWarning`
  )
    return false;

  return originalEmit.apply(process, arguments);
};

let home = homedir();
let os = platform();
let homewin;
if (os == "win32") {
  homewin = home;
  home = home.replace(/\\/g, "/");
}

let dir = fs.existsSync(process.env.REEJS_CUSTOM_DIR) ? process.env.REEJS_CUSTOM_DIR : `${home}/.reejs`;
//check if the .reejs/storage exists else create it
if (!fs.existsSync(`${dir}/storage`)) {
  fs.mkdirSync(`${dir}/storage`);
}
function logger(msg, lvl = "DEBUG") {
  lvl = lvl.toUpperCase();
  console.log(`[${lvl}] ${msg}`);
}

function isReejsFolder() {
  return fs.existsSync(`${process.cwd()}/.reecfg`);
}

function downloadFile(url, dest, cb) {
  var file = fs.createWriteStream(dest);
  get(url, function (response) {
    response.pipe(file);
    file.on("finish", function () {
      file.close(cb);
    });
  });
}
if (!fs.existsSync(`${dir}/storage/features`)) {
  fs.writeFileSync(`${dir}/storage/features`, "", "utf8");
}
let featuresList = fs.readFileSync(`${dir}/storage/features`, "utf8").split("\n").filter((e) => { return e != "" });
const cli = sade("reejs");
cli.version(pkg.version);

//read all the files from cmds folder and eval them
const cmds = fs.readdirSync(`${__dirname}/cmds`);
cmds
  .filter((f) => f.endsWith(".js"))
  .forEach((cmd) => {
    const file = `${__dirname}/cmds/${cmd}`;
    const code = fs.readFileSync(file, "utf8") + `//# sourceURL=${file}`;
    //run code with Function
    new Function(
      "pkg", "cli", "color", "fs", "path", "exec", "spawn", "execSync", "readConfig", "featuresList", "dir", "downloadFile", "isReejsFolder", "logger", "platform", "homedir", "home", "homewin", code)
      (pkg, cli, color, fs, path, exec, spawn, execSync, readConfig, featuresList, dir, downloadFile, isReejsFolder, logger, platform, homedir, home, homewin);
  });

cli.parse(process.argv);
