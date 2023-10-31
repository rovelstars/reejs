import fs from "node:fs";
import path from "pathe";
import dl from "@reejs/imports/URLImportInstaller.js";
import { sync } from "./npmsync.js";

export let install = async (name, url, opts = {}) => {
  let ua = opts["user-agent"] || opts["u"];
  // we would show time taken to install the package
  let start = Date.now();
  let isBrowser = opts?.browser || opts?.b ? "browserImports" : "imports";
  if (!fs.existsSync(path.join(process.cwd(), "reecfg.json"))) {
    console.log(
      "%c[REEJS] %cThis is not a reejs project!",
      "color: red",
      "color: yellow"
    );
    return;
  }
  if (!name) {
    console.log(
      "%c[DOWNLOAD] %cInstalling all packages mentioned in import_map.json ...",
      "color: #805ad5",
      "color: yellow"
    );
    let import_map = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "import_map.json"))
    );
    await Promise.all(
      Object.keys(import_map.imports).map(async key => {
        await dl(import_map.imports[key], true, null, null, ua);
      })
    );
    let end = Date.now();
    if (!opts.nosync) await sync();
    let time = (end - start) / 1000;
    console.log(
      "%c[DOWNLOAD] %cInstalled all packages in " + time + "s",
      "color: green",
      "color: blue"
    );
    return process.exit(0);
  }
  if (!url) {
    if (fs.existsSync(path.join(process.cwd(), "import_map.json"))) {
      let import_map = JSON.parse(
        fs.readFileSync(path.join(process.cwd(), "import_map.json"))
      );
      if (import_map[isBrowser][name]) {
        url = import_map[isBrowser][name];
      } else {
        if (!name.startsWith("https://") && !name.startsWith("http://")) {
          url = `https://esm.sh/${name}?bundle`;
          //use fetch head and get the redirect url
          let res = await fetch(url, {
            method: "HEAD",
            redirect: "manual",
          });
          if (res.status === 302) {
            url = res.headers.get("location");
          }
        } else {
          url = name;
        }
      }
      await dl(url, true, null, null, ua);
      // add to import_map.json
      import_map[isBrowser][name] = url;
      fs.writeFileSync(
        path.join(process.cwd(), "import_map.json"),
        JSON.stringify(import_map, null, 2)
      );
    }
  } else {
    await dl(url, true, null, null, ua);
    // add to import_map.json
    let import_map = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "import_map.json"))
    );
    import_map[isBrowser][name] = url;
    fs.writeFileSync(
      path.join(process.cwd(), "import_map.json"),
      JSON.stringify(import_map, null, 2)
    );
  }
  let end = Date.now();
  let time = (end - start) / 1000;
  if (!opts.nosync) await sync();
  console.log(
    "%c[DOWNLOAD] %cInstalled " + name + " in " + time + "s",
    "color:green",
    "color:blue;font-weight:bold;"
  );
};

export default function add(prog) {
  prog
    .command("add [name] [url]")
    .alias(["install", "i"])
    .option("-f, --force", "Install default URLs")
    .option("-b, --browser", "Install as browser dependency")
    .option("-u, --user-agent", "Set user agent to download the package")
    .describe("Add a package to your project")
    .action(install);
}
