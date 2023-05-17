import DynamicImport from "../../imports/dynamicImport.js";
import NativeImport from "../../imports/nativeImport.js";
import SpecialFileImport from "../../imports/specialFileImport.js";
import { Import } from "../../imports/URLImport.js";
import copyFolderSync from "../../utils/copyFolder.js";
import { packit as oldPackit } from "./packit.bkp.js";

let fs = await NativeImport("node:fs");
let path = await NativeImport("node:path");
let { spawn } = await NativeImport("node:child_process");
let terser = await Import("terser@5.16.6");
let processCwd = globalThis?.process?.cwd?.() || Deno.cwd();

let importmap =
  fs.existsSync(path.join(processCwd, "import_map.json"))
    ? DynamicImport(await import(`${processCwd}/import_map.json`,
      { assert: { type: "json" } }))
    : {};
let cachemap =
  fs.existsSync(path.join(processCwd, ".reejs", "cache", "cache.json"))
    ? DynamicImport(
      await import(`${processCwd}/.reejs/cache/cache.json`, {
        assert: { type: "json" },
      }))
    : {};

let childProcess = null;

let getPackage = (pkg) => {
  let url = importmap.imports?.[pkg] || importmap.browserImports?.[pkg];
  if (!url) {
    throw new Error(`Package ${pkg} not found in import map.`);
  }
  return cachemap[url] ? ("./" + path.join(".reejs", "cache", cachemap[url]))
    : url;
};

function getFiles(dir) {
  try {
    const files = fs.readdirSync(dir);
    let fileList = [];

    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        fileList = fileList.concat(getFiles(filePath));
      } else {
        fileList.push(filePath);
      }
    });

    return fileList;
  } catch (e) {
    // fixes: cannot find src/components
    return [];
  }
}

export let packit = async (service, isDevMode) => {
  if (!fs.existsSync(path.join(processCwd, "packit.config.js"))) {
    console.log("%c[PACKIT] %cNo packit.config.js found, Defaulting to old packit.", "color: #db2777", "color: #ffffff");
    return oldPackit(service, isDevMode);
  }
  else {
    let config = DynamicImport(await import(`${processCwd}/packit.config.js`));
    config.plugins = config.plugins || [];
    let plugins = config.plugins.map(async (plugin) => {
      plugin.register();
      return plugin;
    });

  };
}

  export default function Packit(prog) {
    prog.command("packit [service]")
      .describe("Pack your project for deployment")
      .option("-d, --dev", "Run in development mode")
      .action(async (service, opts) => {
        let watch = opts.dev || opts.d;
        if (watch) {
          if (globalThis?.process?.env) process.env.NODE_ENV = "development";
          if (globalThis?.Deno?.env) Deno.env.set("NODE_ENV", "development");
          packit(service, true);
          console.log("%c[PACKIT] %cPress %c`r` %cto restart", "color: #db2777",
            "color: #ffffff", "color: blue", "color: #ffffff");
          // watch for keypress r
          let readline = DynamicImport(await import("node:readline"));
          // Emit keypress events on process.stdin
          readline.emitKeypressEvents(process.stdin)
          // Set raw mode to true to get individual keystrokes
          if (process.stdin.isTTY) {
            process.stdin.setRawMode(true)
          }
          // Listen to the 'keypress' event
          process.stdin.on('keypress', (str, key) => {
            if (key.name == "r") {
              console.log("%c[PACKIT] %cRestarting...", "color: #db2777",
                "color: #ffffff");
              packit(service, true);
            }
            // Exit if Ctrl+C is pressed
            if (key && key.ctrl && key.name == 'c') {
              if (childProcess && service == "node") {
                console.log("%c[PACKIT] %cstopping server", "color: #db2777",
                  "color: #ffffff");
                if (!childProcess.exitCode) process.kill(-childProcess.pid);
              }
              process.exit()
            }
          })
        } else {
          if (globalThis?.process?.env) process.env.NODE_ENV = "production";
          if (globalThis?.Deno?.env) Deno.env.set("NODE_ENV", "production");
          packit(service, false);
        }
      });
  }
