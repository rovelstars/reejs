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

console.log(`[INFO] Linking ${color("assets/libs","blueBright")} folder!`);
        let libs = fs.readdirSync(`${process.cwd()}/assets/libs`);
        libs.forEach(lib=>{
            //make soft link to node_modules/@reejs/<lib>
            let libPath = `${process.cwd()}/assets/libs/${lib}`;
            let jsSrc = fs.readFileSync(`${libPath}/.rekt`,"utf8").split("\n");
            let scope = (readConfig(jsSrc, "scope") || "true")=="true"?true:false;
            let alias = readConfig(jsSrc, "alias");
            let libLink = `${process.cwd()}/node_modules/${scope?"@reejs/":""}${alias || lib}`;
            if(!fs.existsSync(`${process.cwd()}/node_modules/${scope?"@reejs/":""}${alias || lib}`)) {
                try{
                fs.mkdirSync(`${process.cwd()}/node_modules/`);
                }catch(e){}
                try{
                fs.mkdirSync(`${process.cwd()}/node_modules/${scope?"@reejs/":""}`);
                }catch(e){}
            }
            if(!fs.existsSync(libLink)) {
                fs.symlinkSync(libPath,libLink);
                console.log(`[INFO] Linked ${color(lib,"blueBright")} -> ${color(scope?"@reejs/":""+(alias || lib), "blueBright")}`);
            }
            else{
                console.log(`[INFO] ${color(lib,"blueBright")} is already linked${alias?` (as ${alias})`:""}; skipping...`);
            }
        }
        );