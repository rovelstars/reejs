import DynamicImport from "@reejs/imports/dynamicImport.js";
import NativeImport from "@reejs/imports/nativeImport.js";
import { Import } from "@reejs/imports/URLImport.js";
let crypto = await NativeImport("node:crypto");
import SpecialFileImport from "@reejs/imports/specialFileImport.js";
import dl, { URLToFile, UA } from "@reejs/imports/URLImportInstaller.js";
import { install as AddPackage } from "./add.js";
import copyFolder from "@reejs/utils/copyFolder.js";
import versions from "../version.js";
import merge from "./utils/merge.js";
import {
  readers,
  transpilers,
  writers,
  copyToPackit,
  defaultTranspiler,
} from "./utils/Packit.js";
let fs = await NativeImport("node:fs");
let fsp = await NativeImport("node:fs/promises");
let path = await NativeImport("node:path");
let { spawn } = await NativeImport("node:child_process");
let terser;
let processCwd = globalThis?.process?.cwd?.() || Deno.cwd();

let importmap = fs.existsSync(path.join(processCwd, "import_map.json"))
  ? DynamicImport(
    await import(`${processCwd}/import_map.json`, {
      assert: { type: "json" },
    })
  )
  : {};
let cachemap = fs.existsSync(
  path.join(processCwd, ".reejs", "cache", "cache.json")
)
  ? DynamicImport(
    await import(`${processCwd}/.reejs/cache/cache.json`, {
      assert: { type: "json" },
    })
  )
  : {};

let childProcess = null;

let letMeKnowWhatServiceItIs;

let getPackage = async pkg => {
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
    return "./" + path.join(".reejs", "cache", URLToFile(url, true));
  }
  return "./" + path.join(".reejs", "cache", cachemap[url]);
};

let MODIFIED_FILES;
let runPackitTwice; //packit needs to be run twice in order to get the correct files. this is during the first run without any cache available.
if (!fs.existsSync(path.join(".reejs", "files.cache"))) {
  if (fs.existsSync("reecfg.json")) {
    if (!fs.existsSync(".reejs")) {
      fs.mkdirSync(".reejs");
    }
    fs.writeFileSync(path.join(".reejs", "files.cache"), "[]");
    runPackitTwice = true;
  }
}
try {
  MODIFIED_FILES = JSON.parse(
    fs.readFileSync(path.join(".reejs", "files.cache")).toString()
  );
} catch (_) {
  MODIFIED_FILES = [];
}

let configFile;
let config;

export let packit = async (service, isDevMode, runOneTime) => {
  if (service == "deno") {
    service = "deno-deploy";
  }
  process.env.REEJS_UA = UA;
  if (service == "deno-deploy") {
    process.env.REEJS_UA = "Deno/1.36";
  }
  let chokidar;
  if (isDevMode && !runOneTime) {
    chokidar = await Import("v132/chokidar@3.5.2?bundle", {
      internalDir: true,
    });
  }
  letMeKnowWhatServiceItIs = service;
  //set an env called PACKIT_RUNNING to true
  if (globalThis?.process) globalThis.process.env.PACKIT_RUNNING = "true";
  if (globalThis?.Deno) globalThis.Deno.env.set("PACKIT_RUNNING", "true");
  globalThis.packitEvent.emit("start");
  if (
    (globalThis?.process?.env?.DEBUG || globalThis?.Deno?.env?.get("DEBUG")) &&
    isDevMode
  )
    console.log(
      "%c[PACKIT] %cDon't use debug for benchmarking! Run debug in order to see what takes the longest time...",
      "color: #db2777",
      "color: yellow"
    );

  if (config._experimental_features) {
    console.log("%c[PACKIT] %cExperimental features enabled: %c" + config._experimental_features.join(", "), "color: #db2777", "color: yellow", "color: gray")
    if (config._experimental_features.includes("htmx")) {
      //if importmap doesn't have htmx, add it
      if (!importmap.imports?.["htmx.org"]) {
        importmap.imports["htmx.org"] = "https://esm.sh/htmx.org@1.9.6"
        await AddPackage("htmx.org", "https://esm.sh/htmx.org@1.9.6", { nosync: true })
      }
      //if browserImports doesn't have htmx, add it
      if (!importmap.browserImports?.["htmx.org"]) {
        importmap.browserImports["htmx.org"] = "https://esm.sh/htmx.org@1.9.6"
      }
    }
  }
  if (!fs.existsSync(path.join(processCwd, "dist"))) {
    fs.mkdirSync(path.join(processCwd, "dist"));
  }

  let Readers = merge(config.disableDefaults ? [] : readers, config.readers);
  let Transpilers = merge(
    config.disableDefaults == true ? [] : transpilers,
    config.transpilers
  ); // use disableDefaults = {} to disable everything except transpilers
  let Writers = merge(config.disableDefaults ? [] : writers, config.writers);
  let Plugins = config.plugins || [];

  let wantsToKnowPackitStarted = [];
  let wantsToKnowPackitEnded = [];
  let MODIFIED_FILES_PLUGINS;
  try {
    MODIFIED_FILES_PLUGINS = JSON.parse(
      fs.readFileSync(path.join(".reejs", "plugins.cache")).toString()
    );
  } catch (e) {
    MODIFIED_FILES_PLUGINS = [];
  }
  globalThis.PACKIT_LOADERS = merge([], config.loaders);
  let fakeConfig = {
    plugins: Plugins,
    optimizeDeps: config.viteConfig?.optimizeDeps || { force: undefined },
    server: {},
  };

  Plugins.map(async p => {
    //if plugin is a promise, await it
    if (p instanceof Promise) p = await p;
    let registerPlugin = plugin => {
      if (plugin.raw) plugin = plugin.raw();
      if (!plugin.name) throw new Error("Plugin must have a name property!");
      //build plugins should not run in dev mode, and serve plugins should not run in production mode
      if (plugin.apply == "build" && isDevMode) return;
      if (plugin.apply == "serve" && !isDevMode) return;
      //TODO: learn more about the options and implement them (properly)
      if (
        typeof plugin.apply == "function" &&
        !plugin.apply(fakeConfig, { command: isDevMode ? "serve" : "build" })
      )
        return;
      //polfill vite config hook: https://vitejs.dev/guide/api-plugin.html#config
      if (plugin.config) {
        let modifiedConfig = plugin.config(fakeConfig, {
          command: isDevMode ? "serve" : "build",
          mode: isDevMode ? "development" : "production",
          ssrBuild: false,
        });
        if (modifiedConfig)
          fakeConfig = Object.assign(fakeConfig, modifiedConfig);
      }
      if (fakeConfig.logLevel) {
        config.logLevel = fakeConfig.logLevel;
      }
      if (plugin.load || plugin.resolveId) {
        globalThis.PACKIT_LOADERS.push({
          name: plugin.name,
          load: plugin.load,
          resolveId: plugin.resolveId,
        });
      }
      if (plugin.buildStart) {
        //TODO: learn more about the options and implement them
        wantsToKnowPackitStarted.push(plugin.buildStart);
      }
      if (plugin.buildEnd) {
        wantsToKnowPackitEnded.push({ type: 0, fn: plugin.buildEnd });
      }
      if (plugin.closeBundle) {
        wantsToKnowPackitEnded.push({ type: 1, fn: plugin.closeBundle });
      }
      if (plugin.transform) {
        Transpilers.push({
          index: plugin.enforce == "pre" ? -100 : 0,
          transformInclude: plugin.transformInclude || /\.(j|t)sx?$/,
          run: async (fileURL, service) => {
            if (
              globalThis?.process?.env?.PSC_DISABLE != "true" &&
              globalThis?.Deno?.env?.get("PSC_DISABLE") != "true"
            ) {
              // check if the file was modified, by comparing the mtime
              let mtime = fs.statSync(fileURL).mtimeMs;
              // MODIFIED_FILES looks like: [{ f: file, s: savedAt, at: mtime}]
              let modified = MODIFIED_FILES_PLUGINS.find(e => e.f == fileURL);
              if (modified && modified.at == mtime) {
                // the file was not modified, so we can use the cached version. Return savedAt
                return modified.s;
              }
            }
            let code = fs.readFileSync(fileURL).toString();
            let tnow = Date.now();
            let transformed = await plugin.transform(code, fileURL);
            if (transformed) {
              tnow = Date.now() - tnow;
              let savedto =
                path.join(
                  ".reejs",
                  "packit",
                  "plugins",
                  plugin.name,
                  crypto
                    .createHash("sha256")
                    .update(fileURL)
                    .digest("hex")
                    .slice(0, 6)
                ) +
                "." +
                path.extname(fileURL).slice(1);
              fs.writeFileSync(savedto, transformed?.code || transformed);
              if (
                globalThis?.process?.env?.DEBUG ||
                globalThis?.Deno?.env?.get("DEBUG")
              )
                console.log(
                  `%c  ➜  Plugin %c${plugin.name} - %c✨ %c${fileURL} %c-> %c${savedto} %cin ${tnow}ms`,
                  "color: #db2777",
                  "color: #db2777; font-weight: bold",
                  "color: yellow",
                  "color: yellow; font-weight: bold",
                  "color: yellow",
                  "color: yellow; font-weight: bold",
                  "color: gray"
                );
              //remove the old file from MODIFIED_FILES array if it exists
              MODIFIED_FILES_PLUGINS = MODIFIED_FILES_PLUGINS.filter(
                e => e.f != fileURL
              );
              //add savedAt to MODIFIED_FILES array as {file: savedAt, at: mtime} where mtime is the mtime of the file
              MODIFIED_FILES_PLUGINS.push({
                f: fileURL,
                s: savedto,
                at: fs.statSync(fileURL).mtimeMs,
              });
              return await SpecialFileImport(
                fileURL,
                null,
                service,
                transformed?.code || transformed
              );
            } else {
              return fileURL;
            }
          },
        });
      }
      if (
        !fs.existsSync(path.join(".reejs", "packit", "plugins", plugin.name)) &&
        config.logLevel != "silent"
      ) {
        console.log(
          `%c  ➜  Plugin %c${plugin.name} - %cRegistered!`,
          "color: #db2777",
          "color: #db2777; font-weight: bold",
          "color: green; font-weight: bold"
        );
        fs.mkdirSync(path.join(".reejs", "packit", "plugins", plugin.name), {
          recursive: true,
        });
      }
    };
    if (Array.isArray(p)) return p.map(registerPlugin);
    else registerPlugin(p);
  });

  await Promise.all(
    wantsToKnowPackitStarted.map(async e => {
      await e();
    })
  );

  //writers have an index property, so we need to sort them by index
  Writers.sort((a, b) => (a?.index || 0) - (b?.index || 0));
  // CopyToPackit is an array of functions that return an object like {files: [], folders: []}
  // config.copyToPackit may or may not exist, so we need to check for it
  let CopyToPackit = config.copyToPackit
    ? [...config.copyToPackit, ...copyToPackit]
    : copyToPackit;
  if (config.disableDefaults) {
    CopyToPackit = [];
    if (config.copyToPackit) {
      CopyToPackit = config.copyToPackit;
    }
  }
  CopyToPackit = Array.from(new Set(CopyToPackit)); // remove duplicates
  let then = Date.now();
  //iterate over readers and log files
  let savedFiles = [];
  let reader_then = Date.now();
  await Promise.all(
    Readers.map(async reader => {
      let { glob } = await Import("v132/glob@10.2.7?bundle", {
        internalDir: true,
      });
      let files = typeof reader.run == "function" ? await reader.run(glob) : [];
      if (!reader.run && typeof reader.pattern == "string") {
        files = await glob(reader.pattern, { ignore: reader?.exclude || [] });
      }
      if (typeof reader == "string") {
        files = await glob(reader);
      }
      if (!Array.isArray(files))
        throw new Error(`Reader \`${reader}\` must return an array of files.`);
      savedFiles.push({ [reader.name]: files });
    })
  );
  if (
    (globalThis?.process?.env?.DEBUG || globalThis?.Deno?.env?.get("DEBUG")) &&
    Readers.length &&
    config.logLevel != "silent"
  )
    console.log(
      "%c[PACKIT] %cReaders finished in %c" + (Date.now() - reader_then) + "ms",
      "color: #db2777",
      "color: #ffffff",
      "color: #10b981"
    );

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
    let extensions = Object.keys(savedFilesByReader).map(reader =>
      savedFilesByReader[reader].map(file => path.extname(file).slice(1))
    );
    allExtensions.push(...extensions[0]);
  });
  allExtensions = [...new Set(allExtensions)];

  // writers must not run in parallel, as they are writing to the same file. mainFile is the code for index.js
  let mainFile = [];
  async function TranspileFile(fileURL, service, code) {
    if (!service) throw new Error("parameter `service` is required");
    if (!fileURL) return;
    let ext = path.extname(fileURL).slice(1);
    let tts = Transpilers.filter(
      e =>
        e?.name == ext ||
        (typeof e?.transformInclude == "function" &&
          e.transformInclude(fileURL)) ||
        (typeof e?.transformInclude == "object" &&
          e.transformInclude.test(fileURL))
    ).sort((a, b) => (a?.index || 0) - (b?.index || 0));
    if (!tts.length) {
      console.log(
        "%c[PACKIT] %cNo transpiler found for %c" + ext,
        "color: #db2777",
        "color: #ffffff",
        "color: #10b981"
      );
    }
    //run tts one by one
    let savedto = fileURL;
    for (const tt of tts) {
      //plugins are wrapped in a function that takes the code and transpiles, and saves the code to savedto and returns the path to the file
      savedto = await tt.run(savedto, service, code);
    }
    //we ask packit to copy the file to its own data.
    savedto = await defaultTranspiler(savedto, service, code);
    return savedto;
  }
  let writer_then = Date.now();
  //iterate over writers and write files
  let DATA; // allow writers to pass data to other writers
  for (let writer in Writers) {
    try {
      let { glob } = await Import("v132/glob@10.2.7?bundle", {
        internalDir: true,
      });
      let helpers = {
        getPackage,
        mainFile: "",
        savedFiles,
        TranspileFile,
        terser,
        fs,
        path,
        processCwd,
        importmap,
        cachemap,
        isDevMode,
        DATA,
        glob,
        config,
        chokidar
      };
      let data;
      try {
        data = await Writers[writer].run(helpers, service);
      } catch (e) {
        console.log(
          `%c[ERROR] %cWriter %c${Writers[writer].name}%c failed to execute.`,
          "color: #db2777",
          "color: red",
          "color: gray",
          "color: red"
        );
        console.error(e);
        //TODO: cancel current packit running and continue with the old server code
        data = {
          chunk: "",
          DATA,
        };
      }
      if (
        (globalThis?.process?.env?.DEBUG ||
          globalThis?.Deno?.env?.get("DEBUG")) &&
        config.logLevel != "silent"
      )
        console.log(
          "%c[PACKIT] %cWriter %c" +
          Writers[writer].name +
          "%c finished in %c" +
          (Date.now() - writer_then) +
          "ms",
          "color: #db2777",
          "color: #ffffff",
          "color: #10b981",
          "color: #ffffff",
          "color: #10b981"
        );
      //if writer returns code & data, save it, otherwise keep the old mainFile code and data
      if (data.mainFile)
        console.log(
          `%c[PACKIT] %cWriter %c${Writers[writer].name}%c returned "mainFile". This is deprecated. Please use "chunk" instead.`,
          "color: #db2777",
          "color: red",
          "color: gray",
          "color: red"
        );
      if (!data.chunk) {
        // mainFile = data?.mainFile || mainFile;
        // we don't want to overwrite mainFile, so we push the code to mainFile
        mainFile.push({
          at: Writers[writer].writeIndex || Writers[writer].index || 0,
          chunk: data?.mainFile || "",
        });
      }
      if (data.chunk) {
        mainFile.push({
          at: Writers[writer].writeIndex || Writers[writer].index || 0,
          chunk: data.chunk,
        });
      }
      DATA = data?.DATA || DATA;
    } catch (e) {
      console.log(
        `%c[ERROR] %cWriter %c${Writers[writer].name}%c failed to execute.`,
        "color: #db2777",
        "color: red",
        "color: gray",
        "color: red"
      );
      throw e;
    }
  }
  mainFile = mainFile
    .sort((a, b) => a.at - b.at)
    .map(e => e.chunk)
    .join("\n");
  //after all writers have run, written code to mainFile and transpiled needed files, Packit starts saving all stuff to PWD/packit folder
  if (
    (globalThis?.process?.env?.DEBUG || globalThis?.Deno?.env?.get("DEBUG")) &&
    Writers.length &&
    config.logLevel != "silent"
  )
    console.log(
      "%c[PACKIT] %cWriters finished in %c" + (Date.now() - writer_then) + "ms",
      "color: #db2777",
      "color: #ffffff",
      "color: #10b981"
    );

  if (!isDevMode) {
    //copy files & folders to packit folder
    let copy_then = Date.now();
    let { glob } = await Import("v132/glob@10.2.7?bundle", {
      internalDir: true,
    });
    await Promise.all(
      CopyToPackit.map(async fn => {
        let data = await fn(service, isDevMode, glob);
        await Promise.all(
          data.files.map(async file => {
            if (file == ".reejs/files.cache") return;
            if (file == ".reejs/copy.cache") return;
            if (file == ".reejs/serve.cache") return;
            let stat = await fsp
              .stat(path.join(processCwd, file))
              .catch(() => false);
            if (stat) {
              if (
                globalThis?.process?.env?.PSC_DISABLE != "true" &&
                globalThis?.Deno?.env?.get("PSC_DISABLE") != "true"
              ) {
                // check if the file was modified, by comparing the mtime
                let mtime = stat.mtimeMs;
                let modified = MODIFIED_FILES.find(
                  e => e.f == file.replace(processCwd + "/", "")
                );
                if (modified && modified.at == mtime) {
                  return;
                }
              }
              MODIFIED_FILES = MODIFIED_FILES.filter(
                e => e.f != file.replace(processCwd + "/", "")
              );
              MODIFIED_FILES.push({
                f: file.replace(processCwd + "/", ""),
                at: stat.mtimeMs,
              });
              if (stat.isDirectory()) return; // don't copy folders. plugin should have passed folders array for that.
              await fsp.mkdir(
                path.dirname(path.join(processCwd, "dist", file)),
                { recursive: true }
              );
              await fsp.copyFile(
                path.join(processCwd, file),
                path.join(processCwd, "dist", file)
              );
            }
          })
        );
        await Promise.all(
          data.folders.map(async folder => {
            if (fs.existsSync(path.join(processCwd, folder))) {
              await copyFolder(
                path.join(processCwd, folder),
                path.join(processCwd, "dist", folder)
              );
            }
          })
        );
      })
    );

    if (
      (globalThis?.process?.env?.DEBUG ||
        globalThis?.Deno?.env?.get("DEBUG")) &&
      CopyToPackit.length &&
      config.logLevel != "silent"
    )
      console.log(
        "%c[PACKIT] %cCopyToPackit finished in %c" +
        (Date.now() - copy_then) +
        "ms",
        "color: #db2777",
        "color: #ffffff",
        "color: #10b981"
      );
  }
  fs.writeFileSync(
    isDevMode
      ? path.join(processCwd, "packit.build.js")
      : path.join(processCwd, "dist", "index.js"),
    mainFile
  );

  await Promise.all(
    wantsToKnowPackitEnded.map(async fn => {
      if (fn.type == 0) await fn.fn();
      else if (fn.type == 1 && !isDevMode) await fn.fn();
    })
  );
  //fire event for specialFileImport to know that packit is done running, now let it cleanup and prepare for next run
  globalThis.packitEvent.emit("done");
  if (config.logLevel != "silent")
    console.log(
      `%c  ➜  %c${config.fakeVite ? "⚡️" : "📦 "}in ${(
        (Date.now() - then) /
        1000
      ).toFixed(3)}s`,
      `color: ${config.fakeVite ? "green" : "#db2777"}`,
      "color: gray"
    );
  //run fs async save MODIFIED_FILES as it should not block the main thread
  if (fs.existsSync("reecfg.json")) {
    fs.writeFile(
      path.join(".reejs", "plugins.cache"),
      JSON.stringify(MODIFIED_FILES_PLUGINS),
      () => { }
    );
  }
  if (globalThis?.process) globalThis.process.env.PACKIT_RUNNING = "";
  if (globalThis?.Deno) globalThis.Deno.env.set("PACKIT_RUNNING", "");

  if (isDevMode && !runOneTime) {
    try {
      if (!childProcess?.exitCode) childProcess?.kill?.();
    } catch (e) { }
    if (service == "node") {
      childProcess = spawn("node", [path.join(processCwd, "packit.build.js")], {
        detached: false,
        stdio: ["ignore", "inherit", "inherit"],
        env: { ...process.env },
      });
    } else if (service == "deno-deploy") {
      childProcess = spawn(
        "deno",
        ["run", "-A", path.join(processCwd, "packit.build.js")],
        {
          detached: false,
          stdio: ["ignore", "inherit", "inherit"],
          env: { ...process.env },
        }
      );
    } else if (service == "bun") {
      childProcess = spawn(
        "bun",
        ["run", path.join(processCwd, "packit.build.js")],
        {
          detached: false,
          stdio: ["ignore", "inherit", "inherit"],
          env: { ...process.env },
        }
      );
    }
  }
  if (fs.existsSync("reecfg.json")) {
    await fs.writeFile(
      path.join(".reejs", "files.cache"),
      JSON.stringify(MODIFIED_FILES),
      () => { }
    );
  }
};

export default function Packit(prog) {
  prog
    .command("packit [service]")
    .describe("Pack your project for deployment")
    .option("-d, --dev", "Run in development mode")
    .option("-w, --watch", "Watch for changes (beta)")
    .option("-o, --onetime", "Run development mode only once")
    .action(async (service, opts) => {
      if (!fs.existsSync(path.join(processCwd, "packit.config.js"))) {
        console.log(
          "%c[PACKIT] %cNo packit.config.js file found. Please create one in order to use packit.",
          "color: #db2777",
          "color: yellow"
        );
        return process.exit(1);
      }
      if (!fs.existsSync(path.join(processCwd, "packit.build.js"))) {
        await Promise.all(
          [
            "https://esm.sh/v132/mime-types@2.1.35",
            "https://esm.sh/v132/chokidar@3.5.2?bundle",
            "https://esm.sh/v132/glob@10.2.7?bundle",
            "https://esm.sh/v132/terser@5.16.6?bundle",
            "https://esm.sh/v132/sucrase@3.32.0?bundle",
          ].map(async e => {
            await dl(e, false);
          })
        );
      }
      let devMode = opts.dev || opts.d;
      let onetime = opts.onetime || opts.o;
      configFile = await SpecialFileImport("packit.config.js", null, service);
      config = DynamicImport(await import(path.join(processCwd, configFile)));
      if (fs.existsSync(path.join(processCwd, "reecfg.json"))) {
        let reecfg = await import(path.join(processCwd, "reecfg.json"), {
          assert: { type: "json" },
        });
        config.disablePreactCompat = reecfg.default.features.includes("react");
      }
      config.mode = devMode ? "development" : "production";
      if (config.clearScreen != false) console.clear();
      if (!service) throw new Error("[PACKIT] parameter `service` is required");

      if (!config.disablePackitStartupLog) {
        console.log("");
        console.log(
          `%c  PACKIT %c 🍱 %cv${versions.reejs.version} - ${service}${devMode ? "" : " | packing for production"
          }`,
          "font-weight: bold; background-color: #db2777",
          "",
          "color: #db2777"
        );
        console.log("");
      }
      if (devMode) {
        if (globalThis?.process?.env) process.env.NODE_ENV = "development";
        if (globalThis?.Deno?.env) Deno.env.set("NODE_ENV", "development");
        //Listen for file changes with chokidar
        let chokidar = await Import("v132/chokidar@3.5.2?bundle", {
          internalDir: true,
        });
        await packit(service, true, onetime);
        if (runPackitTwice) {
          console.log(
            "%c  ➜  %c🚀 Preparing to go %call-out ✨✨",
            "color: #db2777",
            "color: gray",
            "color: #10b981; font-weight: bold"
          );
          await packit(service, true, onetime);
          runPackitTwice = false;
        }
        if (!onetime) {
          let open;
          if (config.disablePackitStartupLog)
            open = await Import("npm:open@9.1.0", { internalDir: true });
          if (!config.disablePackitStartupLog)
            console.log(
              "%c  ➜  %cpress%c h %cto show help",
              "color: #db2777",
              "color: gray",
              "color: #10b981",
              "color: gray"
            );
          // watch for keypress r
          let readline = DynamicImport(await import("node:readline"));
          // Emit keypress events on process.stdin
          readline.emitKeypressEvents(process.stdin);
          // Set raw mode to true to get individual keystrokes
          if (process.stdin.isTTY) {
            process.stdin.setRawMode(true);
          }
          // Listen to the 'keypress' event
          process.stdin.on("keypress", async (str, key) => {
            if (key.name == "r") {
              //if packit is already running, do nothing
              if (globalThis?.process?.env?.PACKIT_RUNNING == "true")
                return console.log(
                  "%c  ➜  %cPackit is already running. Please wait & try again.",
                  "color: #db2777",
                  "color: gray"
                );
              if (globalThis?.Deno?.env?.get("PACKIT_RUNNING") == "true")
                return console.log(
                  "%c  ➜  %cPackit is already running. Please wait & try again.",
                  "color: #db2777",
                  "color: gray"
                );
              console.log(
                "%c  ➜  %cRestarting...",
                `color: ${config.fakeVite ? "green" : "#db2777"}`,
                "color: gray"
              );
              await packit(service, true);
            } else if (key.name == "d") {
              // toggle debug mode. if env present, delete it, otherwise set it
              if (globalThis?.process?.env)
                globalThis.process.env.DEBUG = globalThis.process.env.DEBUG
                  ? ""
                  : "true";
              if (globalThis?.Deno?.env)
                globalThis.Deno.env.set(
                  "DEBUG",
                  globalThis.Deno.env.get("DEBUG") ? "" : "true"
                );
              console.log(
                "%c  ➜  %cDebug mode %c" +
                (globalThis?.process?.env?.DEBUG ||
                  globalThis?.Deno?.env?.get("DEBUG")
                  ? "enabled"
                  : "disabled"),
                "color: #db2777",
                "color: #6b7280",
                "color: #10b981"
              );
              console.log(
                "%c  ➜  %cRestart to apply changes",
                `color: ${config.fakeVite ? "green" : "#db2777"}`,
                "color: #6b7280"
              );
            } else if (key.name == "q" || (key.ctrl && key.name == "c")) {
              if (childProcess) {
                console.log(
                  "%c  ➜  %cstopping server",
                  `color: ${config.fakeVite ? "green" : "#db2777"}`,
                  "color: #6b7280"
                );
                try {
                  if (!childProcess?.exitCode) childProcess?.kill?.();
                } catch (e) { }
              }
              process.exit();
            } else if (key.name == "a") {
              //disable specialFileImport cache by toggling the env variable `PSC_DISABLE`
              if (globalThis?.process?.env)
                globalThis.process.env.PSC_DISABLE = globalThis.process.env
                  .PSC_DISABLE
                  ? ""
                  : "true";
              if (globalThis?.Deno?.env)
                globalThis.Deno.env.set(
                  "PSC_DISABLE",
                  globalThis.Deno.env.get("PSC_DISABLE") ? "true" : ""
                );
              //console.log("hmm",globalThis.Deno.env.get("PSC_DISABLE"),"hmm")
              console.log(
                "%c  ➜  %cFile caching %c" +
                (globalThis?.process?.env?.PSC_DISABLE ||
                  globalThis?.Deno?.env?.get("PSC_DISABLE")
                  ? "disabled"
                  : "enabled"),
                "color: #db2777",
                "color: #6b7280",
                "color: #10b981"
              );
              console.log(
                "%c  ➜  %cRestart to apply changes",
                `color: ${config.fakeVite ? "green" : "#db2777"}`,
                "color: #6b7280"
              );
            } else if (key.name == "o" && config.disablePackitStartupLog) {
              //open the browser
              open(`http://localhost:${process.env.PORT || 3000}`);
            } else if (key.name == "c") {
              //clear console and again show the logo
              console.clear();
              console.log("");
              console.log(
                `%c  ${config.fakeVite
                  ? "VITE"
                  : `PACKIT %cv${versions.reejs.version} - ${service}`
                }`,
                `color: ${config.fakeVite ? "green" : "#db2777"
                }; font-weight: bold`,
                "color: #db2777"
              );
              console.log("");
            } else if (key.name == "h") {
              console.log("%c  Shortcuts", "font-weight: bold");
              console.log(
                `%c  ➜  %cpress %cr %cto ${config.disablePackitStartupLog
                  ? "restart the server"
                  : "ree-pack"
                }`,
                `color: ${config.fakeVite ? "green" : "#db2777"}`,
                "color: #6b7280",
                "color: #10b981",
                "color: #6b7280"
              );
              console.log(
                "%c  ➜  %cpress %cq %cto quit",
                `color: ${config.fakeVite ? "green" : "#db2777"}`,
                "color: #6b7280",
                "color: #10b981",
                "color: #6b7280"
              );
              console.log(
                "%c  ➜  %cpress %cd %cto toggle debug mode",
                `color: ${config.fakeVite ? "green" : "#db2777"}`,
                "color: #6b7280",
                "color: #10b981",
                "color: #6b7280"
              );
              console.log(
                "%c  ➜  %cpress %ca %cto toggle file caching",
                `color: ${config.fakeVite ? "green" : "#db2777"}`,
                "color: #6b7280",
                "color: #10b981",
                "color: #6b7280"
              );
              console.log(
                "%c  ➜  %cpress %cc %cto clear console",
                `color: ${config.fakeVite ? "green" : "#db2777"}`,
                "color: #6b7280",
                "color: #10b981",
                "color: #6b7280"
              );
              if (config.fakeVite)
                console.log(
                  "%c  ➜  %cpress %co %cto open the browser",
                  `color: ${config.fakeVite ? "green" : "#db2777"}`,
                  "color: #6b7280",
                  "color: #10b981",
                  "color: #6b7280"
                );
            }
          });
          let watcher = chokidar.watch(".", {
            ignored: [
              ".reejs/**",
              "node_modules/**",
              "packit/**",
              "packit.build.js",
              ".git/**",
              ".gitignore",
            ],
          });
          watcher.on("change", async file => {
            //if packit is already running, do nothing
            if (globalThis?.process?.env?.PACKIT_RUNNING == "true")
              return console.log(
                "%c  ➜  %cPackit is already running. Please wait & try again.",
                "color: #db2777",
                "color: #6b7280"
              );
            if (globalThis?.Deno?.env?.get("PACKIT_RUNNING") == "true")
              return console.log(
                "%c  ➜  %cPackit is already running. Please wait & try again.",
                "color: #db2777",
                "color: #6b7280"
              );
            console.log(
              "%c  ➜  %cRestarting due to changes...",
              "color: #db2777",
              "color: #6b7280"
            );
            await packit(service, true);
          });
        }
      } else {
        //setup PSC_DISABLE env variable. PSC_DISABLE is used to disable terser
        if (!terser)
          terser = await Import("terser@5.16.6?bundle", { internalDir: true });
        if (globalThis?.process?.env)
          globalThis.process.env.PSC_DISABLE = "true";
        if (globalThis?.Deno?.env)
          globalThis.Deno.env.set("PSC_DISABLE", "true");
        if (globalThis?.process?.env) process.env.NODE_ENV = "production";
        if (globalThis?.Deno?.env) Deno.env.set("NODE_ENV", "production");
        //TODO: DEBUG is used to show packit logs. someone should pr to make logs read NODE_ENV too and not just DEBUG.
        //if (globalThis?.process?.env) globalThis.process.env.DEBUG = "true";
        //if (globalThis?.Deno?.env) globalThis.Deno.env.set("DEBUG", "true");
        await packit(service, false);
      }
    });
}
