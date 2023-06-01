import DynamicImport from "@reejs/imports/dynamicImport.js";
import NativeImport from "@reejs/imports/nativeImport.js";
import { Import } from "@reejs/imports/URLImport.js";
import copyFolderSync from "@reejs/utils/copyFolder.js";
import versions from "../version.js";
import { packit as oldPackit } from "./packit.bkp.js";
import { readers, transpilers, writers, copyToPackit } from "./utils/Packit.js";
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

export let packit = async (service, isDevMode) => {
  if (!fs.existsSync(path.join(processCwd, "packit.config.js")) || (globalThis?.process?.env?.USE_OLD || globalThis?.Deno?.env?.get("USE_OLD"))) {
    console.log("%c[PACKIT] %cNo packit.config.js found, Defaulting to old packit.", "color: #db2777", "color: #ffffff");
    return oldPackit(service, isDevMode);
  }
  else {
    let config = DynamicImport(await import(`${processCwd}/packit.config.js`));
    if (fs.existsSync(path.join(processCwd, "packit"))) {
      fs.rmSync(path.join(processCwd, "packit"), { recursive: true, force: true });
    }
    fs.mkdirSync(path.join(processCwd, "packit"));
    //config.plugins is an object like <file extension>: <plugin>
    let Readers = Object.assign({}, config.readers, readers);
    let Transpilers = Object.assign({}, config.transpilers, transpilers);
    let Writers = Object.assign({}, config.writers, writers);
    let CopyToPackit = Object.assign({}, config.copyToPackit, copyToPackit);
    let copyFilesToPackit = CopyToPackit.files || [];
    let copyFoldersToPackit = CopyToPackit.folders || [];

    let then = Date.now();

    //iterate over readers and log files
    let savedFiles = [];
    await Promise.all(Object.keys(Readers).map(async (reader) => {
      let files = await Readers[reader]();
      if (!Array.isArray(files)) throw new Error(`Reader \`${reader}\` must return an array of files.`);
      savedFiles.push({ [reader]: files });
    }));
    //get all files from savedFiles ending with extension passed to function
    async function getFilesFromSavedFiles(extension) {
      let files = [];
      for (let i = 0; i < savedFiles.length; i++) {
        let reader = Object.keys(savedFiles[i])[0];
        let file = savedFiles[i][reader].find(file => file.endsWith(extension));
        if (file) files.push(file);
      }
      return files;
    }
    let allExtensions = [];
    savedFiles.forEach(savedFilesByReader => {
      let extensions = Object.keys(savedFilesByReader).map(reader => savedFilesByReader[reader].map(file => path.extname(file).slice(1)
      ));
      allExtensions.push(...extensions[0]);
    });
    allExtensions = [...new Set(allExtensions)];

    // writers must not run in parallel, as they are writing to the same file. mainFile is the code for index.js
    let mainFile = "";
    async function TranspileFile(fileURL, service) {
		if(!fileURL) return;
      let ext = path.extname(fileURL).slice(1);
      if(!Transpilers[ext]){
        console.log("%c[PACKIT] %cNo transpiler found for %c" + ext, "color: #db2777", "color: #ffffff", "color: #10b981");
      }
      return await Transpilers[ext](fileURL, service);
     };
    //iterate over writers and write files
    for (let writer in Writers) {
      //console.log("%c[PACKIT] Running Writer: %c" + Writers[writer].name, "color: #db2777", "color: #ffffff");
      let helpers = {
        getPackage, mainFile, savedFiles, TranspileFile, terser, fs, path, processCwd, importmap, cachemap, isDevMode
      };
      mainFile = await Writers[writer].run(helpers,service) || mainFile; //if writer returns code, save it, otherwise keep the old mainFile code
    }
    //after all writers have run, written code to mainFile and transpiled needed files, Packit starts saving all stuff to PWD/packit folder

    //copy files & folders to packit folder
    copyFilesToPackit.forEach(file => {
      fs.copyFileSync(path.join(processCwd, file), path.join(processCwd, "packit", file));
      //console.log("%c[PACKIT] %cCopied 📄 " + file, "color: #db2777", "color: #10b981");
    });
    copyFoldersToPackit.forEach(folder => {
      copyFolderSync(path.join(processCwd, folder), path.join(processCwd, "packit", folder));
      //console.log("%c[PACKIT] %cCopied 📁 " + folder, "color: #db2777", "color: #10b981");
    });
    fs.writeFileSync(path.join(processCwd, "packit", "index.js"), mainFile);
    //console.log("%c[PACKIT] %cWrote 📄 index.js", "color: #db2777", "color: #10b981");
    console.log("%c  ➜  %c📦 in " + ((Date.now() - then)/1000) + "s", "color: #db2777", "color: #6b7280");
	  if(service=="node" && isDevMode){
		  if (!childProcess?.exitCode && childProcess) process.kill(-childProcess.pid);
	  childProcess = spawn("node", [path.join(processCwd,"packit", "index.js")], { detached: true, stdio: "inherit" });
	  }
  };
}

export default function Packit(prog) {
  prog.command("packit [service]")
    .describe("Pack your project for deployment")
    .option("-d, --dev", "Run in development mode")
    .action(async (service, opts) => {
      console.clear();
      console.log(`%c  PACKIT%cv${versions.reejs.version}`, "color: #db2777; font-weight: bold", "color: #db2777");
      console.log("");
      let watch = opts.dev || opts.d;
      if (watch) {
        if (globalThis?.process?.env) process.env.NODE_ENV = "development";
        if (globalThis?.Deno?.env) Deno.env.set("NODE_ENV", "development");
        packit(service, true);
        console.log("%c  ➜  %cpress%ch%cto show help", "color: #db2777",
          "color: #6b7280", "color: #10b981", "color: #6b7280");
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
            console.log("%c  ➜  %cRestarting...", "color: #db2777",
              "color: #6b7280");
            packit(service, true);
          }
          // Exit if Ctrl+C is pressed
          if (key && key.ctrl && key.name == 'c') {
            if (childProcess && service == "node") {
              console.log("%c  ➜  %cstopping server", "color: #db2777",
                "color: #6b7280");
              if (!childProcess?.exitCode) process.kill(-childProcess.pid);
            }
            process.exit()
          }
        });
      } else {
        if (globalThis?.process?.env) process.env.NODE_ENV = "production";
        if (globalThis?.Deno?.env) Deno.env.set("NODE_ENV", "production");
        packit(service, false);
      }
    });
}
