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

    //check for all the files that end with .rekt
    //if same files with extension .js exists, skip
    //if not, copy the file with extension .rekt to .js
    if (isReejsFolder()) {
      if (!fs.existsSync(`${process.cwd()}/assets/libs/`)) {
        console.log("[INFO] Creating assets folder");
        try {
          fs.mkdirSync(`${process.cwd()}/assets`);
        } catch (e) {}
        try {
          fs.mkdirSync(`${process.cwd()}/assets/libs`);
        } catch (e) {}
      }
      if (!fs.existsSync(`${process.cwd()}/libs`)) {
        console.log("[INFO] Creating libs folder");
        fs.mkdirSync(`${process.cwd()}/libs`);
      }
      let files = fs.readdirSync(`${process.cwd()}/libs`);
      let jsfiles = files.filter((f) => f.endsWith(".rekt"));
      jsfiles.forEach((file) => {
        const name = file.replace(".rekt", "");
        let dest = `${process.cwd()}/assets/libs/${name}/`;

        if (opts.force && fs.existsSync(dest)) {
          fs.rmSync(dest, { recursive: true, force: true });
          console.log(`[INFO] Removed ${name}`);
        }
        if (fs.existsSync(dest + ".rekt")) {
          let data = fs.readFileSync(dest + ".rekt", "utf8");
          let newData = fs.readFileSync(
            `${process.cwd()}/libs/${file}`,
            "utf8"
          );
          newData = newData.split("\n");
          data = data.split("\n");
          let oldVersion = readConfig(data, "version");
          let newVersion = readConfig(newData, "version");
          let oldUrl = readConfig(data, "url");
          let newUrl = readConfig(newData, "url");
          let moduleType = readConfig(data, "type") || "commonjs";
          let _as = readConfig(newData, "as") || "index.js";
          if (_as.includes("/")) {
            //get the part before the last /
            let temp = _as.split("/");
            _as = temp.pop();
            let dir = temp.join("/");
            if (dir) {
              //recursive make the directory
              console.log(`[INFO] Creating directory ${dir} for ${_as}`);
              dest = `${dest}${dir}/`;
              try {
                fs.mkdirSync(dest, { recursive: true });
              } catch (e) {}
            }
            //get the part after the last /
            _as = _as.substring(0, _as.lastIndexOf("/"));
          }
          let more = readConfig(newData, "more");
          let more_as;
          if (more) {
            more_as = readConfig(newData, "more_as");
          }
          if (more && more?.length != more_as?.length) {
            if(more_as.some((a) => a.includes("/"))) {
              more_as.forEach((a, i) => {
                let temp = a.split("/");
                a = temp.pop();
                let dir = temp.join("/");
                let tempdir = `${process.cwd()}/assets/libs/${name}/${dir}`;
                if (!fs.existsSync(tempdir)) {
                  console.log(`[INFO] Creating directory ${dir} for ${a}`);
                  fs.mkdirSync(tempdir, { recursive: true });
                }
              });
            }
            console.log(
              color(
                `[ERROR] \`more\` and \`more_as\` must be the same length for ${name}`,
                "red"
              )
            );
            process.exit(1);
          }
          if (newVersion == "latest")
            console.log(
              "[WARN] Don't use @latest versions! This packages will be always updated even if no new updates happen to them."
            );
          let shouldDownload = false;
          if (oldVersion != newVersion || newVersion == "latest")
            shouldDownload = true;
          if (oldUrl != newUrl) shouldDownload = true;
          if (opts.force) shouldDownload = true;
          if (shouldDownload) {
            console.log(
              `[INFO] Updating Library ${name} ${
                newVersion != oldVersion
                  ? `from v${oldVersion} to v${newVersion} `
                  : ""
              }...`
            );
            _as = readConfig(newData, "as") || "index.js";
            _as = _as.split("/").pop();
            downloadFile(newUrl, dest + _as, () => {
              console.log(
                `[SUCCESS] Updated Library ${color(name, "green")} | [${color(
                  newUrl,
                  "blue"
                )} -> ${color(`/${name}/` + _as, "yellow")}]`
              );
              //read same file
              let data = fs.readFileSync(dest + _as, "utf8");
              data = data.split("\n");
              //find the line that starts with "//# sourceMappingURL"
              let sourceMapLine = data.findIndex((line) =>
                line.startsWith("//# sourceMappingURL")
              );
              //remove that line if exists
              if (sourceMapLine != -1) {
                data.splice(sourceMapLine, 1);
                fs.writeFileSync(dest + _as, data.join("\n"));
              }
              //join data and write it to the file
              data = data.join("\n");
              fs.writeFileSync(dest + _as, data);
            });
            if (more) {
              more.forEach((m, i) => {
                downloadFile(m, dest + more_as[i], () => {
                  console.log(
                    `[SUCCESS] Updated Library ${color(
                      name,
                      "green"
                    )} | [${color(m, "blue")} -> ${color(
                      `/${name}/` + more_as[i],
                      "yellow"
                    )}]`
                  );
                  //read same file
              let data = fs.readFileSync(dest + _as, "utf8");
              data = data.split("\n");
              //find the line that starts with "//# sourceMappingURL"
              let sourceMapLine = data.findIndex((line) =>
                line.startsWith("//# sourceMappingURL")
              );
              //remove that line if exists
              if (sourceMapLine != -1) {
                data.splice(sourceMapLine, 1);
                fs.writeFileSync(dest + _as, data.join("\n"));
              }
              //join data and write it to the file
              data = data.join("\n");
              fs.writeFileSync(dest + _as, data);
                });
              });
            }

            //copy js.src to assets
            fs.copyFileSync(
              `${process.cwd()}/libs/${file}`,
              `${process.cwd()}/assets/libs/${name}/.rekt`
            );
            let pkg = `{"name":"${name}","version":"${newVersion}","url":"${newUrl}","main":"${dir+"/"+_as}","type":"${moduleType}"}`;
            fs.writeFileSync(
              `${process.cwd()}/assets/libs/${name}/package.json`,
              pkg
            );
          }
          if (!shouldDownload) {
            console.log(`[INFO] Download skipped for library ${name}`);
          }

          
          // I literally cant see this area!


        } else {
          let newData = fs.readFileSync(
            `${process.cwd()}/libs/${file}`,
            "utf8"
          );
          newData = newData.split("\n");
          let newVersion = readConfig(newData, "version");
          let newUrl = readConfig(newData, "url");
          let _as = readConfig(newData, "as") || "index.js";
          let dir = "";
          //create folder if not already exists
          if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest);
          }
          if (_as.includes("/")) {
            //get the part before the last /
            let temp = _as.split("/");
            _as = temp.pop();
            dir = temp.join("/");
            if (dir) {
              //recursive make the directory
              console.log(`[INFO] Creating directory ${dir} for ${_as}`);
              dest = `${dest}${dir}/`;
              try {
                fs.mkdirSync(dest, { recursive: true });
              } catch (e) {}
            }
            //get the part after the last /
            _as = _as.substring(0, _as.lastIndexOf("/"));
          }
          let moduleType = readConfig(newData, "type") || "commonjs";
          let more = readConfig(newData, "more");
          let more_as;
          if (more) {
            more_as = readConfig(newData, "more_as");
          }
          if (more && more?.length != more_as?.length) {
            if(more_as.some((a) => a.includes("/"))) {
              more_as.forEach((a, i) => {
                let temp = a.split("/");
                a = temp.pop();
                let dir = temp.join("/");
                let tempdir = `${process.cwd()}/assets/libs/${name}/${dir}`;
                if (!fs.existsSync(tempdir)) {
                  console.log(`[INFO] Creating directory ${dir} for ${a}`);
                  fs.mkdirSync(tempdir, { recursive: true });
                }
              });
            }
            console.log(
              color(
                `[ERROR] \`more\` and \`more_as\` must be the same length for ${name}`,
                "red"
              )
            );
            process.exit(1);
          }
          console.log(`[INFO] Downloading Library ${name} ...`);
          _as = readConfig(newData, "as") || "index.js";
          _as = _as.split("/").pop();
          downloadFile(newUrl, dest + _as, () => {
            console.log(
              `[SUCCESS] Downloaded Library ${color(name, "green")} | [${color(
                newUrl,
                "blue"
              )} -> ${color(`/${name}/` + _as, "yellow")}]`
            );
            //read same file
            let data = fs.readFileSync(dest + _as, "utf8");
            data = data.split("\n");
            //find the line that starts with "//# sourceMappingURL"
            let sourceMapLine = data.findIndex((line) =>
              line.startsWith("//# sourceMappingURL")
            );
            //remove that line if exists
            if (sourceMapLine != -1) {
              data.splice(sourceMapLine, 1);
              fs.writeFileSync(dest + _as, data.join("\n"));
            }
            //join data and write it to the file
            data = data.join("\n");
            fs.writeFileSync(dest + _as, data);
          });
          if (more) {
            more.forEach((m, i) => {
              downloadFile(m, dest + more_as[i], () => {
                console.log(
                  `[SUCCESS] Downloaded Library ${color(
                    name,
                    "green"
                  )} | [${color(m, "blue")} -> ${color(
                    `/${name}/` + more_as[i],
                    "yellow"
                  )}]`
                );
                //read same file
              let data = fs.readFileSync(dest + _as, "utf8");
              data = data.split("\n");
              //find the line that starts with "//# sourceMappingURL"
              let sourceMapLine = data.findIndex((line) =>
                line.startsWith("//# sourceMappingURL")
              );
              //remove that line if exists
              if (sourceMapLine != -1) {
                data.splice(sourceMapLine, 1);
                fs.writeFileSync(dest + _as, data.join("\n"));
              }
              //join data and write it to the file
              data = data.join("\n");
              fs.writeFileSync(dest + _as, data);
              });
            });
          }

          //copy js.src to assets
          fs.copyFileSync(
            `${process.cwd()}/libs/${file}`,
            `${process.cwd()}/assets/libs/${name}/.rekt`
          );
          let pkg = `{"name":"${name}","version":"${newVersion}","url":"${newUrl}","main":"${dir+"/"+_as}","type":"${moduleType}"}`;
          fs.writeFileSync(
            `${process.cwd()}/assets/libs/${name}/package.json`,
            pkg
          );
        }
      });
    } else {
      console.log("[WARN] You are not in a Reejs folder");
    }