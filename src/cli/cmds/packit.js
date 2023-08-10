import DynamicImport from "@reejs/imports/dynamicImport.js";
import NativeImport from "@reejs/imports/nativeImport.js";
import { Import } from "@reejs/imports/URLImport.js";
let crypto = await NativeImport("node:crypto");
import SpecialFileImport from "@reejs/imports/specialFileImport.js";
import dl, { URLToFile } from "@reejs/imports/URLImportInstaller.js";
import copyFolder from "@reejs/utils/copyFolder.js";
import versions from "../version.js";
import { sync, syncSpecific } from "./npmsync.js";
import merge from "./utils/merge.js";
import { readers, transpilers, writers, copyToPackit, defaultTranspiler } from "./utils/Packit.js";
let fs = await NativeImport("node:fs");
let fsp = await NativeImport("node:fs/promises");
let path = await NativeImport("node:path");
let { spawn } = await NativeImport("node:child_process");
let terser;
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

let letMeKnowWhatServiceItIs;

let getPackage = async (pkg) => {
  let url = importmap.imports?.[pkg] || importmap.browserImports?.[pkg];
  if (!url) {
    throw new Error(`Package ${pkg} not found in import map.`);
  }
  // if (letMeKnowWhatServiceItIs == "deno-deploy") {
  //   return url;
  // }
  if (!cachemap[url]) {
    //await dl(url, true);
    //await syncSpecific(url);
    return ("./" + path.join(".reejs", "cache", URLToFile(url, true)));
  }
  return ("./" + path.join(".reejs", "cache", cachemap[url]));
};

let MODIFIED_FILES;

if (!fs.existsSync(path.join(".reejs", "files.cache"))) {
  if (fs.existsSync("reecfg.json")) {
    if (!fs.existsSync(".reejs")) {
      fs.mkdirSync(".reejs");
    }
    fs.writeFileSync(path.join(".reejs", "files.cache"), "[]");
  }
}
try {
  MODIFIED_FILES = JSON.parse(fs.readFileSync(path.join(".reejs", "files.cache")).toString());
} catch (_) {
  MODIFIED_FILES = [];
}

export let packit = async (service, isDevMode, runOneTime) => {
  if (service == "deno") {
    service = "deno-deploy";
  }
  if(service=="deno-deploy"){
    process.env.USE_UA_REEJS = "Deno/1.36";
  }
  if (!fs.existsSync(path.join(processCwd, "packit.config.js"))) {
    console.log("%c[PACKIT] %cNo packit.config.js file found. Please create one in order to use packit.", "color: #db2777", "color: yellow");
    return process.exit(1);
  }
  letMeKnowWhatServiceItIs = service;
  //set an env called PACKIT_RUNNING to true
  if (globalThis?.process) globalThis.process.env.PACKIT_RUNNING = "true";
  if (globalThis?.Deno) globalThis.Deno.env.set("PACKIT_RUNNING", "true");
  if (globalThis?.process?.env?.DEBUG || globalThis?.Deno?.env?.get("DEBUG"))
    console.log("%c[PACKIT] %cDon't use debug for benchmarking! Run debug in order to see what takes the longest time...", "color: #db2777", "color: yellow");
  let configFile = await SpecialFileImport("packit.config.js", null, service);
  let config = DynamicImport(await import(path.join(processCwd, configFile)));
  if (!fs.existsSync(path.join(processCwd, "packit"))) {
    fs.mkdirSync(path.join(processCwd, "packit"));
  }

  let Readers = merge(readers, config.readers);
  let Transpilers = merge(transpilers, config.transpilers);
  let Writers = merge(writers, config.writers);
  let Unplugins = config.unplugins || [];

  let wantsToKnowPackitStarted = [];
  let wantsToKnowPackitEnded = [];
  let MODIFIED_FILES_PLUGINS;
  try {
    MODIFIED_FILES_PLUGINS = JSON.parse(fs.readFileSync(path.join(".reejs", "plugins.cache")).toString());
  } catch (e) {
    MODIFIED_FILES_PLUGINS = [];
  }
  globalThis.PACKIT_LOADERS = merge([], config.loaders);
  Unplugins.forEach((unplugin) => {
    if (unplugin.raw) unplugin = unplugin.raw();
    if (!unplugin.name) throw new Error("Unplugin's plugin must have a name property!");
    if (unplugin.load) {
      globalThis.PACKIT_LOADERS.push({
        name: unplugin.name,
        load: unplugin.load
      });
    }
    if (unplugin.buildStart) {
      //TODO: learn more about the options and implement them
      wantsToKnowPackitStarted.push(unplugin.buildStart);
    }
    if (unplugin.buildEnd) {
      wantsToKnowPackitEnded.push(unplugin.buildEnd);
    }
    if (unplugin.transform && unplugin.transformInclude) {
      Transpilers.push({
        index: (unplugin.enforce == "pre") ? -1 : 1,
        transformInclude: unplugin.transformInclude,
        run: async (fileURL, service) => {
          if (globalThis?.process?.env?.PSC_DISABLE != "true" && globalThis?.Deno?.env?.get("PSC_DISABLE") != "true") {
            // check if the file was modified, by comparing the mtime
            let mtime = fs.statSync(fileURL).mtimeMs;
            // MODIFIED_FILES looks like: [{ f: file, s: savedAt, at: mtime}]
            let modified = MODIFIED_FILES_PLUGINS.find((e) => e.f == fileURL);
            if (modified && modified.at == mtime) {
              // the file was not modified, so we can use the cached version. Return savedAt
              return modified.s;
            };
          }
          let code = fs.readFileSync(fileURL).toString();
          let tnow = Date.now();
          let transformed = await unplugin.transform(code, fileURL);
          tnow = Date.now() - tnow;
          let savedto = path.join(".reejs", "packit", "plugins", unplugin.name, crypto.createHash("sha256").update(fileURL).digest("hex").slice(0, 6)) + "." + path.extname(fileURL).slice(1);
          fs.writeFileSync(savedto, transformed?.code || transformed);
          if (globalThis?.process?.env?.DEBUG || globalThis?.Deno?.env?.get("DEBUG"))
            console.log(`%c  ➜  Plugin %c${unplugin.name} - %c✨ %c${fileURL} %c-> %c${savedto} %cin ${tnow}ms`, "color: #db2777", "color: #db2777; font-weight: bold", "color: yellow", "color: yellow; font-weight: bold", "color: yellow", "color: yellow; font-weight: bold", "color: gray");
          //remove the old file from MODIFIED_FILES array if it exists
          MODIFIED_FILES_PLUGINS = MODIFIED_FILES_PLUGINS.filter((e) => e.f != fileURL);
          //add savedAt to MODIFIED_FILES array as {file: savedAt, at: mtime} where mtime is the mtime of the file
          MODIFIED_FILES_PLUGINS.push({ f: fileURL, s: savedto, at: fs.statSync(fileURL).mtimeMs });
          return await SpecialFileImport(fileURL, null, service, transformed?.code || transformed);
        }
      });
    }
    if (!fs.existsSync(path.join(".reejs", "packit", "plugins", unplugin.name))) {
      console.log(`%c  ➜  Plugin %c${unplugin.name} - %cRegistered!`, "color: #db2777", "color: #db2777; font-weight: bold", "color: green; font-weight: bold");
      fs.mkdirSync(path.join(".reejs", "packit", "plugins", unplugin.name), {
        recursive: true
      });
    }
  });

  await Promise.all(wantsToKnowPackitStarted.map(async (e) => {
    await e();
  }));

  //writers have an index property, so we need to sort them by index
  Writers.sort((a, b) => (a?.index || 0) - (b?.index || 0));
  // CopyToPackit is an array of functions that return an object like {files: [], folders: []}
  // config.copyToPackit may or may not exist, so we need to check for it
  let CopyToPackit = config.copyToPackit ? [...config.copyToPackit, ...copyToPackit] : copyToPackit;
  let then = Date.now();
  //iterate over readers and log files
  let savedFiles = [];
  let reader_then = Date.now();
  await Promise.all(Readers.map(async (reader) => {
    let { glob } = await Import("glob@10.2.7?bundle", { internalDir: true });
    let files = reader.run ? await reader.run(glob) : [];
    if (!reader.run) {
      files = await glob(reader.pattern, { ignore: reader?.exclude || [] });
    }
    if (!Array.isArray(files)) throw new Error(`Reader \`${reader}\` must return an array of files.`);
    savedFiles.push({ [reader.name]: files });
  }));
  if (globalThis?.process?.env?.DEBUG || globalThis?.Deno?.env?.get("DEBUG"))
    console.log("%c[PACKIT] %cReaders finished in %c" + (Date.now() - reader_then) + "ms", "color: #db2777", "color: #ffffff", "color: #10b981");

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
    if (!service) throw new Error("parameter `service` is required");
    if (!fileURL) return;
    let ext = path.extname(fileURL).slice(1);
    let tts = Transpilers
      .filter(e => e?.name == ext || (typeof e?.transformInclude == "function" && e.transformInclude(fileURL)))
      .sort((a, b) => (a?.index || 0) - (b?.index || 0));
    if (!tts.length) {
      console.log("%c[PACKIT] %cNo transpiler found for %c" + ext, "color: #db2777", "color: #ffffff", "color: #10b981");
    }
    //run tts one by one
    let savedto = fileURL;
    for (const tt of tts) {
      //unplugins are wrapped in a function that takes the code and transpiles, and saves the code to savedto and returns the path to the file
      savedto = await tt.run(savedto, service);
    }
    //we ask packit to copy the file to its own data.
    savedto = await defaultTranspiler(savedto, service);
    return savedto;
  };
  let writer_then = Date.now();
  if (globalThis?.process?.env?.DEBUG || globalThis?.Deno?.env?.get("DEBUG"))
    console.log("%c[PACKIT] %cWriters run parallely!!", "color: #db2777", "color: yellow");
  //iterate over writers and write files
  let DATA; // allow writers to pass data to other writers
  for (let writer in Writers) {
    try {
      let { glob } = await Import("glob@10.2.7?bundle", { internalDir: true });
      let helpers = {
        getPackage, mainFile, savedFiles, TranspileFile, terser, fs, path, processCwd, importmap, cachemap, isDevMode, DATA, glob
      };
      let data = await Writers[writer].run(helpers, service);
      if (globalThis?.process?.env?.DEBUG || globalThis?.Deno?.env?.get("DEBUG"))
        console.log("%c[PACKIT] %cWriter %c" + Writers[writer].name + "%c finished in %c" + (Date.now() - writer_then) + "ms", "color: #db2777", "color: #ffffff", "color: #10b981", "color: #ffffff", "color: #10b981");
      //if writer returns code & data, save it, otherwise keep the old mainFile code and data
      mainFile = data.mainFile || mainFile;
      DATA = data.DATA || DATA;
    } catch (e) {
      console.log(`%c[ERROR] %cWriter %c${Writers[writer].name}%c failed to execute.`, "color: #db2777", "color: red", "color: gray", "color: red");
      //log error and crash
      console.error(e);
    }
  }
  //after all writers have run, written code to mainFile and transpiled needed files, Packit starts saving all stuff to PWD/packit folder
  if (globalThis?.process?.env?.DEBUG || globalThis?.Deno?.env?.get("DEBUG"))
    console.log("%c[PACKIT] %cWriters finished in %c" + (Date.now() - writer_then) + "ms", "color: #db2777", "color: #ffffff", "color: #10b981");

  if (!isDevMode) {
    //copy files & folders to packit folder
    let copy_then = Date.now();
    let { glob } = await Import("glob@10.2.7?bundle", { internalDir: true });
    await Promise.all(CopyToPackit.map(async (fn) => {
      let data = await fn(service, isDevMode, glob);
      await Promise.all(data.files.map(async (file) => {
        if (file == ".reejs/files.cache") return;
        if (file == ".reejs/copy.cache") return;
        if (file == ".reejs/serve.cache") return;
        let stat = await fsp.stat(path.join(processCwd, file)).catch(() => false);
        if (stat) {
          if (globalThis?.process?.env?.PSC_DISABLE != "true" && globalThis?.Deno?.env?.get("PSC_DISABLE") != "true") {
            // check if the file was modified, by comparing the mtime
            let mtime = stat.mtimeMs;
            let modified = MODIFIED_FILES.find((e) => e.f == file.replace(processCwd + "/", ""));
            if (modified && modified.at == mtime) {
              return;
            };
          }
          MODIFIED_FILES = MODIFIED_FILES.filter((e) => e.f != file.replace(processCwd + "/", ""));
          MODIFIED_FILES.push({ f: file.replace(processCwd + "/", ""), at: stat.mtimeMs });
          if (stat.isDirectory()) return; // don't copy folders. plugin should have passed folders array for that.
          await fsp.mkdir(path.dirname(path.join(processCwd, "packit", file)), { recursive: true });
          await fsp.copyFile(path.join(processCwd, file), path.join(processCwd, "packit", file));
        }
      }));
      await Promise.all(data.folders.map(async (folder) => {
        if (fs.existsSync(path.join(processCwd, folder))) {
          await copyFolder(path.join(processCwd, folder), path.join(processCwd, "packit", folder));
        }
      }));
    }));

    if (globalThis?.process?.env?.DEBUG || globalThis?.Deno?.env?.get("DEBUG"))
      console.log("%c[PACKIT] %cCopyToPackit finished in %c" + (Date.now() - copy_then) + "ms", "color: #db2777", "color: #ffffff", "color: #10b981");
  }
  fs.writeFileSync(isDevMode ? path.join(processCwd, "packit.build.js") : path.join(processCwd, "packit", "index.js"), mainFile);

  await Promise.all(wantsToKnowPackitEnded.map(async (fn) => {
    await fn();
  }));

  console.log("%c  ➜  %c📦 in " + ((Date.now() - then) / 1000).toFixed(3) + "s", "color: #db2777", "color: #6b7280");
  //run fs async save MODIFIED_FILES as it should not block the main thread
  if (fs.existsSync("reecfg.json")) {
    fs.writeFile(
      path.join(".reejs", "plugins.cache"),
      JSON.stringify(MODIFIED_FILES_PLUGINS),
      () => { });
  }
  if (globalThis?.process) globalThis.process.env.PACKIT_RUNNING = "";
  if (globalThis?.Deno) globalThis.Deno.env.set("PACKIT_RUNNING", "");

  if (isDevMode && !runOneTime) {
    if (!childProcess?.exitCode && childProcess) process.kill(-childProcess.pid);
    if (service == "node") {
      childProcess = spawn("node", [path.join(processCwd, "packit.build.js")], { detached: true, stdio: "inherit", env: { ...process.env } });
    } else if (service == "deno-deploy") {
      childProcess = spawn("deno", ["run", "-A", path.join(processCwd, "packit.build.js")], { detached: true, stdio: "inherit", env: { ...process.env } });
    } else if (service == "bun") {
      childProcess = spawn("bun", ["run", path.join(processCwd, "packit.build.js")], { detached: true, stdio: "inherit", env: { ...process.env } });
    }
  }
  if (fs.existsSync("reecfg.json")) {
    await fs.writeFile(
      path.join(".reejs", "files.cache"),
      JSON.stringify(MODIFIED_FILES), () => { });
  }
};

export default function Packit(prog) {
  prog.command("packit [service]")
    .describe("Pack your project for deployment")
    .option("-d, --dev", "Run in development mode")
    .option("-o, --onetime", "Run development mode only once")
    .action(async (service, opts) => {
      console.clear();
      console.log(`%c  PACKIT %cv${versions.reejs.version} - ${service}`, "color: #db2777; font-weight: bold", "color: #db2777");
      console.log("");
      let watch = opts.dev || opts.d;
      let onetime = opts.onetime || opts.o;
      if (watch) {
        if (globalThis?.process?.env) process.env.NODE_ENV = "development";
        if (globalThis?.Deno?.env) Deno.env.set("NODE_ENV", "development");
        packit(service, true, onetime);
        if (!onetime) {
          console.log("%c  ➜  %cpress%c h %cto show help", "color: #db2777",
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
          process.stdin.on('keypress', async (str, key) => {
            if (key.name == "r") {
              //if packit is already running, do nothing
              if (globalThis?.process?.env?.PACKIT_RUNNING == "true") return console.log("%c  ➜  %cPackit is already running. Please wait & try again.", "color: #db2777", "color: #6b7280");
              if (globalThis?.Deno?.env?.get("PACKIT_RUNNING") == "true") return console.log("%c  ➜  %cPackit is already running. Please wait & try again.", "color: #db2777", "color: #6b7280");
              console.log("%c  ➜  %cRestarting...", "color: #db2777",
                "color: #6b7280");
              packit(service, true);
            } else if (key.name == "d") {
              // toggle debug mode. if env present, delete it, otherwise set it
              if (globalThis?.process?.env) globalThis.process.env.DEBUG = globalThis.process.env.DEBUG ? "" : "true";
              if (globalThis?.Deno?.env) globalThis.Deno.env.set("DEBUG", globalThis.Deno.env.get("DEBUG") ? "" : "true");
              console.log("%c  ➜  %cDebug mode %c" + (globalThis?.process?.env?.DEBUG || globalThis?.Deno?.env?.get("DEBUG") ? "enabled" : "disabled"), "color: #db2777", "color: #6b7280", "color: #10b981");
              console.log("%c  ➜  %cRestart to apply changes", "color: #db2777", "color: #6b7280");
            } else if (key.name == 'c') {
              if (childProcess) {
                console.log("%c  ➜  %cstopping server", "color: #db2777",
                  "color: #6b7280");
                if (!childProcess?.exitCode) process.kill(-childProcess.pid);
              }
              process.exit()
            } else if (key.name == "a") {
              //disable specialFileImport cache by toggling the env variable `PSC_DISABLE`
              if (globalThis?.process?.env) globalThis.process.env.PSC_DISABLE = globalThis.process.env.PSC_DISABLE ? "" : "true";
              if (globalThis?.Deno?.env) globalThis.Deno.env.set("PSC_DISABLE", globalThis.Deno.env.get("PSC_DISABLE") ? "true" : "");
              //console.log("hmm",globalThis.Deno.env.get("PSC_DISABLE"),"hmm")
              console.log("%c  ➜  %cFile caching %c" + (globalThis?.process?.env?.PSC_DISABLE || globalThis?.Deno?.env?.get("PSC_DISABLE") ? "disabled" : "enabled"), "color: #db2777", "color: #6b7280", "color: #10b981");
              console.log("%c  ➜  %cRestart to apply changes", "color: #db2777", "color: #6b7280");
            } else if (key.name == "l") {
              //clear console and again show the logo
              console.clear();
              console.log(`%c  PACKIT %cv${versions.reejs.version} - ${service}`, "color: #db2777; font-weight: bold", "color: #db2777");
              console.log("");
            } else if (key.name == "h") {
              console.log("%c  ➜  %cHelp", "color: #db2777", "color: #6b7280");
              console.log("%c  ➜  %cPress %c r %c to restart", "color: #db2777", "color: #6b7280", "color: #10b981", "color: #6b7280");
              console.log("%c  ➜  %cPress %c c %c to stop", "color: #db2777", "color: #6b7280", "color: #10b981", "color: #6b7280");
              console.log("%c  ➜  %cPress %c d %c to toggle debug mode", "color: #db2777", "color: #6b7280", "color: #10b981", "color: #6b7280");
              console.log("%c  ➜  %cPress %c a %c to toggle file caching", "color: #db2777", "color: #6b7280", "color: #10b981", "color: #6b7280");
              console.log("%c  ➜  %cPress %c l %c to clear console", "color: #db2777", "color: #6b7280", "color: #10b981", "color: #6b7280");
            }
          });
        }
      } else {
        //setup PSC_DISABLE env variable
        if (globalThis?.process?.env?.TERSER != "false") {
          if (!terser) terser = await Import("terser@5.16.6?bundle", { internalDir: true });
          if (globalThis?.process?.env) globalThis.process.env.PSC_DISABLE = "true";
          if (globalThis?.Deno?.env) globalThis.Deno.env.set("PSC_DISABLE", "true");
          if (globalThis?.process?.env) process.env.NODE_ENV = "production";
          if (globalThis?.Deno?.env) Deno.env.set("NODE_ENV", "production");
          if (globalThis?.process?.env) globalThis.process.env.DEBUG = "true";
          if (globalThis?.Deno?.env) globalThis.Deno.env.set("DEBUG", "true");
        }
        packit(service, false);
      }
    });
}
