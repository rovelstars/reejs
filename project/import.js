import vm from "vm";
import { builtinModules } from "module";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { homedir, platform } from "os";
let home = homedir();
let os = platform();
let homewin;
let Deno;
globalThis.window = globalThis;
window.Deno = Deno;
let ts;
if (os == "win32") {
  homewin = home;
  home = home.replace(/\\/g, "/");
}
let dir = `${home}/.reejs`;
export let import_map = { imports: {} };
try {
  import_map = JSON.parse(fs.readFileSync(`${process.cwd()}/import-maps.json`, "utf8"));
}
catch (e) { };
//console.log(fs.readFileSync(`${process.cwd()}/import-maps.json`, "utf8"),import_map);
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

/**
 * @param {string} url - URL of a source code file.
 * @returns {Promise<string>} Raw source code.
 */
async function fetchCode(url, metaData = {}) {
  //check if file already downloaded at dir/storage/libs/{UrlScheme}/url
  let Url = new URL(url);
  let urlScheme = Url.protocol.replace(":", "");
  let urlPath = Url.host + Url.pathname;
  let urlFile = urlPath.split("/").pop();
  let urlDir = urlPath.split("/").slice(0, -1).join("/");
  let urlDirPath = `${dir}/storage/libs/${urlScheme}/${urlDir}`;
  if (!fs.existsSync(urlDirPath)) {
    fs.mkdirSync(urlDirPath, { recursive: true });
  }
  let urlFilePath = `${urlDirPath}/${urlFile}`;
  if(!urlFilePath.endsWith(".js")) urlFilePath += ".js";
  if (fs.existsSync(urlFilePath)) {
    return fs.readFileSync(urlFilePath, "utf8");
  }
  else {
    const response = await fetch(url);
    if (response.ok) {
      //add the file to the cache at dir/storage/libs/{UrlScheme}/url
      let data = await response.text();
      fs.writeFileSync(urlFilePath, data);
      console.log("[DOWNLOAD]", url, (metaData?.url ? `<< ${metaData.url}` : ""));
      if (url.endsWith(".ts")) {
        console.log("[TYPESCRIPT] Transpiling: " + url);
        ts = await dynamicImport("https://esm.sh/typescript?target=node");
        ts = ts.transpileModule(data, {
          compilerOptions: {
            target: ts.ScriptTarget.ESNext,
            module: ts.ModuleKind.ESNext
          }
        });
        console.log("[TYPESCRIPT] Done: " + url);
        return ts;
      }
      else {
        return data;
      }
    } else if (response.status == 500) {
      //execute the data as a script with url as specifier
      let data = await response.text();
      let result = new vm.SourceTextModule(data, {
        identifier: url,
      });
      await result.link(() => { });
      await result.evaluate();
    }
    else {
      throw new Error(`Error fetching ${url}: ${response.statusText} (${response.status})`);
    }
  }
}

/**
 * @param {URL} url
 * @param {vm.Context} context
 * @returns {Promise<vm.Module>}
 */
async function createModuleFromURL(url, context) {
  let identifier = url.toString();

  if (url.protocol === "http:" || url.protocol === "https:") {
    // Download the code (naive implementation!)
    let source = await fetchCode(identifier, { url: context.__filename });
    // Instantiate a ES module from raw source code.
    let isTS = false;
    if (source.outputText) {
      source = source.outputText;
      isTS = true;
      console.log(isTS ? `[TS -> JS] ${identifier = identifier.slice(0, -2) + "js"}` : identifier);
    }
    return new vm.SourceTextModule(source, {
      identifier,
      context,
    });
  } else if (url.protocol === "node:") {
    const imported = await import(identifier);
    const exportNames = Object.keys(imported);

    return new vm.SyntheticModule(
      exportNames,
      function () {
        for (const name of exportNames) {
          this.setExport(name, imported[name]);
        }
      },
      { identifier, context }
    );
  } else {
    // Other possible schemes could be file: and data:
    // See https://nodejs.org/api/esm.html#esm_urls
    throw new Error(`Unsupported URL scheme: ${url.protocol}`);
  }
}

/**
 * @typedef {object} ImportMap
 * @property {NodeJS.Dict<string>} imports
 *
 * @param {ImportMap} importMap Import map object.
 * @returns Link function.
 */
async function linkWithImportMap({ imports }) {
  /**
   * @param {string} specifier
   * @param {vm.SourceTextModule} referencingModule
   * @returns {Promise<vm.SourceTextModule>}
   */
  return async function link(specifier, referencingModule) {
    let url;
    if (builtinModules.includes(specifier)) {
      // If the specifier is a bare module specifier for a Node.js builtin,
      // a valid "node:" protocol URL is created for it.
      url = new URL("node:" + specifier);
    } else if (url in imports) {
      // If the specifier is contained in the import map, it is used from there.
      url = new URL(imports[specifier]);
    } else {
      // If the specifier is a bare module specifier, but not contained
      // in the import map, it will be resolved against the parent
      // identifier. E.g., "foo" and "https://cdn.skypack.dev/bar" will
      // resolve to "https://cdn.skypack.dev/foo". Relative specifiers
      // will also be resolved against the parent, as expected.
      url = new URL(specifier, referencingModule.identifier);
    }
    return createModuleFromURL(url, referencingModule.context);
  };
}

/**
 * @param {string} url - URL of a source code file.
 * @param {vm.Context} sandbox - Optional execution context.
 * @param {ImportMap} importMap Optional Path to import_map.json file or object.
 * @returns {Promise<any>} Result of the evaluated code.
 */
export default async function dynamicImport(specifier, config = {}, sandbox = {}, { imports = {} } = import_map) {
  // Take a specifier from the import map or use it directly. The
  // specifier must be a valid URL.
  if (specifier.startsWith("https://") || specifier.startsWith("http://") || config.initDeno) {
    let url, isDenoModule;
    if (!config.initDeno) {
      url =
        specifier in imports ? new URL(imports[specifier]) : new URL(specifier);
      // Create an execution context that provides global variables.
      isDenoModule = url.toString().includes("deno.land/");
    }
    if (config.deno) {
      console.log("Asked to use deno");
      isDenoModule = true;
    }
    if (isDenoModule && !Deno) {
      console.log(`[DENO] Adding Polyfills for: ${config.initDeno ? "\"initialization\"" : url}`);
      Deno = await dynamicImport("https://esm.sh/@deno/shim-deno@0.8.0?target=node");
      Deno = Deno.Deno;
      let alert = await dynamicImport("./deno/prompts/alert.js");
      let prompt = await dynamicImport("./deno/prompts/prompt.js");
      let crypto = await dynamicImport("node:crypto");
      window.alert = alert;
      window.prompt = prompt;
      window.crypto = crypto;
      window.Deno = Deno;
      console.log(`[DENO] Polyfills added for Deno`);
      console.log("[DENO] Current Deno version", Deno.version);
    }
    if (config.initDeno) {
      return;
    }
    const cloneGlobal = () => Object.defineProperties(
      { ...global },
      Object.getOwnPropertyDescriptors(global)
    )
    let hmm = {
      ...sandbox,
      Deno, _deno: Deno,
      process, __dynamicImport: dynamicImport,
      console,
      __dirname: sandbox?.__dirname || __dirname, __filename: url.toString()
    };
    const context = vm.createContext({ ...cloneGlobal(), ...hmm });
    // Create the ES module.
    let mod = await createModuleFromURL(url, context);
    // Create a "link" function that uses an optional import map.
    const link = await linkWithImportMap({ imports });
    // Resolve additional imports in the module.
    await mod.link(link);
    // Execute any imperative statements in the module's code.
    await mod.evaluate();
    // The namespace includes the exports of the ES module.
    mod = mod.namespace;
    try {
      let keys = Object.keys(mod).filter(key => key !== "default");
      let namespace = {};
      if (Object.keys(mod).includes("default")) {
        namespace = mod.default;
      }
      keys.forEach(key => {
        namespace[key] = mod[key];
      });
      namespace.default = mod.default;
      return namespace;
    } catch (e) {
      return mod;
    }
  }
  else {
    let fileName;
    let projectDirOrReejs = config.absolutePath;
    if (specifier.endsWith(".ts") || specifier.endsWith(".tsx")) {
      console.log("[TYPESCRIPT] Transpiling: " + specifier);
      ts = await dynamicImport("https://esm.sh/typescript?target=node");
      let data = fs.readFileSync(specifier, "utf8");
      ts = ts.transpileModule(data, {
        compilerOptions: {
          target: ts.ScriptTarget.ESNext,
          module: ts.ModuleKind.ESNext
        }
      });
      console.log("[TYPESCRIPT] Done: " + specifier);
      //save file to disk
      fileName = specifier.endsWith(".tsx") ? specifier.slice(0, -3) + "js" : specifier.slice(0, -2) + "js";
      fileName = fileName.replace("/src/", "/.temp/ts/");
      //make sure the directory exists otherwise recursive create the directory
      let dir = path.dirname(fileName);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(fileName, ts.outputText);
    }
    if(projectDirOrReejs) specifier = process.cwd()+specifier;
    //if on windows, add "file:///" before specifier
    if(process.platform === "win32") specifier = "file:///"+specifier;
    try {
      let mod = await import((fileName || specifier));
      let keys = Object.keys(mod).filter(key => key !== "default");
      let namespace = {};
      if (Object.keys(mod).includes("default")) {
        namespace = mod.default;
      }
      keys.forEach(key => {
        namespace[key] = mod[key];
      });
      namespace.default = mod.default;
      return namespace;
    }
    catch (e) {
      try {
        return await import(specifier);
      } catch (e) {
        //import from import_maps
        if (import_map.imports[specifier]) {
          try {
            return await import(process.cwd() + import_map.imports[specifier]);
          }
          catch (e) {
            try {
              return await dynamicImport(import_map.imports[specifier]);
            }
            catch (e) {
              throw new Error(`Could not import ${import_map.imports[specifier]}\n${e}`);
            }
          }
        }
        else {
          throw new Error(`Could not import ${specifier}\n${e}`);
        }
      }
    }
  }
}