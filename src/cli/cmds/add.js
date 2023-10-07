import fs from "node:fs";
import path from "pathe";
import dl from "@reejs/imports/URLImportInstaller.js";
import { sync } from "./npmsync.js";

export let install = async (name, url, opts) => {
  let ua = opts["user-agent"] || opts["u"];
  // we would show time taken to install the package
  let start = Date.now();
  let isBrowser = opts?.browser || opts?.b ? "browserImports" : "imports";
  if (
    !fs.existsSync(path.join(process.cwd(), "reecfg.json")) &&
    opts["force"] !== true &&
    opts["f"] !== true
  ) {
    console.log(
      "%c[REEJS] %cThis is not a reejs project!",
      "color: red",
      "color: yellow",
    );
    return;
  }
  if (!name) {
    console.log(
      "%c[DOWNLOAD] %cInstalling all packages mentioned in import_map.json ...",
      "color: #805ad5",
      "color: yellow",
    );
    let import_map = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "import_map.json")),
    );
    await Promise.all(
      Object.keys(import_map.imports).map(async key => {
        await dl(import_map.imports[key], true, null, null, ua);
      }),
    );
    let end = Date.now();
    await sync();
    let time = (end - start) / 1000;
    console.log(
      "%c[DOWNLOAD] %cInstalled all packages in " + time + "s",
      "color: green",
      "color: blue",
    );
    return process.exit(0);
  }
  if (!url) {
    if (fs.existsSync(path.join(process.cwd(), "import_map.json"))) {
      let import_map = JSON.parse(
        fs.readFileSync(path.join(process.cwd(), "import_map.json")),
      );
      if (import_map[isBrowser][name]) {
        url = import_map[isBrowser][name];
      } else {
        if (!opts.force && !opts.f) {
          console.log(
            "%c[REEJS] %cPackage not found in import_map.json",
            "color: red",
            "color: yellow",
          );
          console.log(
            "%c[REEJS] %cPlease specify a url alongwith name to add it. Use %c`--force`%c to use default esm.sh with nodejs/browser (based on your args) target & bundled version.",
            "color: red",
            "color: white",
            "color: blue;",
            "color:white",
          );
          return;
        } else {
          if (!name.startsWith("https://") && !name.startsWith("http://")) {
            console.log("Generating default URL...");
            url = `https://esm.sh/${name}?bundle`;
            console.log(url);
          } else {
            url = name;
          }
        }
      }
      await dl(url, true, null, null, ua);
      // add to import_map.json
      import_map[isBrowser][name] = url;
      fs.writeFileSync(
        path.join(process.cwd(), "import_map.json"),
        JSON.stringify(import_map, null, 2),
      );
    }
  } else {
    await dl(url, true, null, null, ua);
    // add to import_map.json
    let import_map = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "import_map.json")),
    );
    console.log(isBrowser, name, url);
    import_map[isBrowser][name] = url;
    fs.writeFileSync(
      path.join(process.cwd(), "import_map.json"),
      JSON.stringify(import_map, null, 2),
    );
  }
  let end = Date.now();
  let time = (end - start) / 1000;
  await sync();
  console.log(
    "%c[DOWNLOAD] %cInstalled " + name + " in " + time + "s",
    "color:green",
    "color:blue;font-weight:bold;",
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
