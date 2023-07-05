import NativeImport from "@reejs/imports/nativeImport.js";
import dl, { followRedirect, URLToFile } from "@reejs/imports/URLImportInstaller.js";
let fs = await NativeImport("node:fs");
let path = await NativeImport("node:path");
let processCwd = globalThis?.process?.cwd?.() || Deno.cwd();
export let sync = async (smt, dir) => {
  if (!fs.existsSync(path.join(dir || processCwd, ".reecfg.json"))) {
    console.log("%c[REEJS] %cThis is not a reejs project!", "color: red",
      "color: yellow");
    return;
  }
  let pkgJson = JSON.parse(fs.readFileSync(
    path.join(dir || processCwd, "package.json"), "utf-8"));
  let import_map = JSON.parse(fs.readFileSync(
    path.join(dir || processCwd, "import_map.json"), "utf-8"));
  let deps = pkgJson.dependencies || {};
  await Promise.all(Object.keys(import_map.imports).map(async (key) => {
    let urldest = await followRedirect(import_map.imports[key]);
    let version = urldest.split("@").pop().split("/")[0];
    import_map.imports[key] = urldest;
    let value = URLToFile(urldest, true).slice(2);
    if (!fs.existsSync(
      path.join(dir || processCwd, ".reejs", "deps", key, "package.json"))) {
      fs.mkdirSync(path.join(dir || processCwd, ".reejs", "deps", key), {
        recursive: true,
      });
      fs.writeFileSync(path.join(dir || processCwd, ".reejs", "deps", key,
        "package.json"),
        JSON.stringify({
          name: key,
          version,
          main: "index.js",
          type: "module",
        },
          null, 2));
      let code;
      try {
        code = fs.readFileSync(
          path.join(dir || processCwd, ".reejs", "cache", value));
      } catch (e) {
        console.log("%c[SYNC] %cError: %cDependency %c`" + key + "`%c not found in cache.\nPlease run %c`reejs add`%c to first download the dependencies", "color: red", "color: yellow", "color: red", "color: blue", "color: red", "color: blue", "color: red");
        process.exit(0);
      }
      // simple check to check whether main file exports	default or not
      code = code.includes("export { default }");
      // numSlash is the number of slashes in key
      let numSlash = key.split("/").length - 1;
      // if numSlash is 1, numSlash = ../, if numSlash is 2, numSlash = ../../
      // etc.
      numSlash = "../".repeat(numSlash + 1);
      fs.writeFileSync(
        path.join(dir || processCwd, ".reejs", "deps", key, "index.js"),
        `export * from "../../${numSlash}.reejs/cache/${value}";${code ? `export {default} from "../../${numSlash}.reejs/cache/${value}"`
          : ""}`);
    }
    // depKey is the key of the dependency in package.json. if the depKey
    // startsWith @, allow only one "/" and the next word after that "/".
    // otherwise remove the "/" and only keep the first word
    let depKey = key.startsWith("@")
      ? key.split("/")[0] + "/" + key.split("/")[1]
      : key.split("/")[0];
    deps[depKey] = `file:./.reejs/deps/${depKey}`;
  }));
  pkgJson.dependencies = deps;
  fs.writeFileSync(path.join(dir || process.cwd(), "package.json"),
    JSON.stringify(pkgJson, null, 2));
  fs.writeFileSync(path.join(dir || processCwd, "import_map.json"),
    JSON.stringify(import_map, null, 2));

  //emulate npm install to link the dependencies to node_modules just like npm install, with fs.symlinkSync
  let node_modules = path.join(dir || processCwd, "node_modules");
  if (!fs.existsSync(node_modules)) {
    fs.mkdirSync(node_modules, {
      recursive: true,
    });
  }

  await Promise.all(fs.readdirSync(path.join(dir || processCwd, ".reejs", "deps")).map(async (key) => {
    let dep = path.join(dir || processCwd, ".reejs", "deps", key);
    let nodeModulesDep = path.join(dir || processCwd, "node_modules", key);
    console.log("+ " + key);
    if (fs.existsSync(nodeModulesDep)) {
      fs.rmSync(nodeModulesDep, { recursive: true });
    }
    fs.symlinkSync(dep, nodeModulesDep, "dir");
  }));

  console.log(
    "%c[SYNC] %cSynced dependencies with package.json",
    "color: #805ad5", "color: green", "color: blue", "color: green");
};




export let syncSpecific = async (url) => {
  let version = url.split("@").pop().split("/")[0];

  //name is the object key in import maps. get the url, use URLToFile to get the local file and setup symlinks and stuff
  if (!fs.existsSync(path.join(processCwd, ".reecfg.json"))) {
    console.log("%c[REEJS] %cThis is not a reejs project!", "color: red",
      "color: yellow");
    return;
  }
  let pkgJson = JSON.parse(fs.readFileSync(
    path.join(processCwd, "package.json"), "utf-8"));
  let import_map = JSON.parse(fs.readFileSync(
    path.join(processCwd, "import_map.json"), "utf-8"));
  let deps = pkgJson.dependencies || {};
  let key = Object.keys(import_map.imports).find(e => import_map.imports[e] === url);
  if (!key) key = Object.keys(import_map.browserImports).find(e => import_map.browserImports[e] === url);
  let urldest = await followRedirect(url);
  let value = URLToFile(urldest, true).slice(2);
  if (!fs.existsSync(path.join(processCwd, ".reejs", "deps", key))) {
    fs.mkdirSync(path.join(processCwd, ".reejs", "deps", key), {
      recursive: true,
    });
    if (!fs.existsSync(path.join(processCwd, ".reejs", "deps", key, "package.json")))
      fs.writeFileSync(path.join(processCwd, ".reejs", "deps", key,
        "package.json"),
        JSON.stringify({
          name: key,
          version,
          main: "index.js",
          type: "module",
        },
          null, 2));
    let code;
    try {
      let savedAt = await dl(url, true);
      code = fs.readFileSync(savedAt);
    } catch (e) {
      console.log("%c[SYNC] %cError: %cDependency %c`" + key + "`%c not found in cache.\nPlease run %c`reejs add`%c to first download the dependencies", "color: red", "color: yellow", "color: red", "color: blue", "color: red", "color: blue", "color: red");
      throw e;
    }
    // simple check to check whether main file exports	default or not
    code = code.includes("export { default }");
    // numSlash is the number of slashes in key
    let numSlash = key.split("/").length - 1;
    // if numSlash is 1, numSlash = ../, if numSlash is 2, numSlash = ../../
    // etc.
    numSlash = "../".repeat(numSlash + 1);
    fs.writeFileSync(
      path.join(processCwd, ".reejs", "deps", key, "index.js"),
      `export * from "../../${numSlash}.reejs/cache/${value}";${code ? `export {default} from "../../${numSlash}.reejs/cache/${value}"`
        : ""}`);

  }
  // depKey is the key of the dependency in package.json. if the depKey
  // startsWith @, allow only one "/" and the next word after that "/".
  // otherwise remove the "/" and only keep the first word
  let depKey = key.startsWith("@")
    ? key.split("/")[0] + "/" + key.split("/")[1]
    : key.split("/")[0];
  deps[depKey] = `file:./.reejs/deps/${depKey}`;
  pkgJson.dependencies = deps;
  fs.writeFileSync(path.join(processCwd, "package.json"),
    JSON.stringify(pkgJson, null, 2));
  fs.writeFileSync(path.join(processCwd, "import_map.json"),
    JSON.stringify(import_map, null, 2));

  //emulate npm install to link the dependencies to node_modules just like npm install, with fs.symlinkSync
  let node_modules = path.join(processCwd, "node_modules");
  if (!fs.existsSync(node_modules)) {
    fs.mkdirSync(node_modules, {
      recursive: true,
    });
  }
  let dep = path.join(processCwd, ".reejs", "deps", key);
  let nodeModulesDep = path.join(processCwd, "node_modules", key);
  if (!fs.existsSync(path.join(processCwd, ".reejs", "cache", value))) {
    let s = await dl(url, true);
    console.log(s);
    if (!fs.existsSync(path.join(processCwd, ".reejs", "cache", value))) throw new Error("Error while downloading dependency: " + key + " = " + s);
  }
  if (fs.existsSync(nodeModulesDep)) {
    return;
  }
  if (key.split("/").length > 2) return;
  try {
    fs.symlinkSync(dep, nodeModulesDep);
  } catch (e) {
    fs.mkdirSync(path.dirname(nodeModulesDep), { recursive: true });
    fs.symlinkSync(dep, nodeModulesDep);
  }
}

export default function add(prog) {
  prog.command("sync")
    .describe("Sync dependencies with package.json")
    .action(sync);
}
