import path from "path";
import { fileURLToPath } from "url";
import { get } from "https";
import fs from "fs";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pkg = JSON.parse(fs.readFileSync(`${__dirname}/../package.json`, "utf8"));
import { homedir, platform } from "os";
let home = homedir();
let os = platform();
let homewin;
if (os == "win32") {
  homewin = home;
  home = home.replace(/\\/g, "/");
}
let dir = `${home}/.reejs`;

function logger(msg, lvl = "DEBUG") {
  lvl = lvl.toUpperCase();
  console.log(`[${lvl}] ${msg}`);
}
function readConfig(arr, word) {
  let e = arr
  .filter((l)=>{return !l.startsWith("#")})
  .filter((l) => {
    return l.split(":")[0].trim() == word.trim();
  });
  if (e?.length) {
    let r = e[0].replace(`${word}:`, "");
    if (r.includes("|") ||(r.startsWith("[") && r.endsWith("]"))) {
      r = r.substring(1, r.length - 1);
      r = r.split("|").map((e) => {
        e = e.trim();
        if (e.startsWith("\"") && e.endsWith("\"")) {
          e = e.substring(1, e.length - 1);
        }
        return e;
      });
      return r;
    } else {
      r = r.trim();
      if (r.startsWith("\"") && r.endsWith("\"")) {
        r = r.substring(1, r.length - 1);
      }
      return r;
    }
  } else return undefined;
}
function isReejsFolder() {
  return true;
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

function color(str, color, bg) {
  return str;
}
let opts = { force: true };

console.log("[FAILSAFE] Setting up polyfills...");