import NativeImport from "../../imports/nativeImport.js";
import { followRedirect, URLToFile } from "../../imports/URLImportInstaller.js";
export let sync = async (smt, dir) => {
  let fs = await NativeImport("node:fs");
  let path = await NativeImport("node:path");
  if (!fs.existsSync(path.join(dir || process.cwd(), ".reecfg.json"))) {
    console.log("%c[REEJS] %cThis is not a reejs project!", "color: red",
      "color: yellow");
    return;
  }
  let pkgJson = JSON.parse(fs.readFileSync(
    path.join(dir || process.cwd(), "package.json"), "utf-8"));
  let import_map = JSON.parse(fs.readFileSync(
    path.join(dir || process.cwd(), "import_map.json"), "utf-8"));
  let deps = pkgJson.dependencies || {};
  await Promise.all(Object.keys(import_map.imports).map(async (key) => {
    let urldest = await followRedirect(import_map.imports[key]);
    import_map.imports[key] = urldest;
    let value = URLToFile(urldest, true).slice(2);
    if (!fs.existsSync(
      path.join(dir || process.cwd(), ".reejs", "deps", key))) {
      fs.mkdirSync(path.join(dir || process.cwd(), ".reejs", "deps", key), {
        recursive: true,
      });
      fs.writeFileSync(path.join(dir || process.cwd(), ".reejs", "deps", key,
        "package.json"),
        JSON.stringify({
          name: key,
          version: "1.0.0",
          main: "index.js",
          type: "module",
        },
          null, 2));
          let code;
          try{
      code = fs.readFileSync(
        path.join(dir || process.cwd(), ".reejs", "cache", value));
      } catch (e){
        console.log("%c[SYNC] %cError: %cDependency %c`" + key + "`%c not found in cache.\nPlease run %c`reejs add`%c to first download the dependencies", "color: red", "color: yellow", "color: red", "color: blue", "color: red", "color: blue", "color: red");
        process.exit(0);
      }
      // simple check to check whether main file exports	default or not
      code = code.includes("export { default }");
      // numSlash is the number of slashes in key
      let numSlash = key.split("/").length - 1;
      // if numSlash is 1, numSlash = ../, if numSlash is 2, numSlash = ../../
      // etc.
      numSlash = "../".repeat(numSlash);
      fs.writeFileSync(
        path.join(dir || process.cwd(), ".reejs", "deps", key, "index.js"),
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
  fs.writeFileSync(path.join(dir || process.cwd(), "import_map.json"),
    JSON.stringify(import_map, null, 2));

    //emulate npm install to link the dependencies to node_modules just like npm install, with fs.symlinkSync
    let node_modules = path.join(dir || process.cwd(), "node_modules");
    if (!fs.existsSync(node_modules)) {
      fs.mkdirSync(node_modules);
    }
    
    await Promise.all(fs.readdirSync(path.join(dir || process.cwd(), ".reejs", "deps")).map(async (key) => {
      let dep = path.join(dir || process.cwd(), ".reejs", "deps", key);
      let nodeModulesDep = path.join(dir || process.cwd(), "node_modules", key);
      console.log("+ "+key);
      if(fs.existsSync(nodeModulesDep)){
        fs.rmSync(nodeModulesDep, {recursive: true});
      }
      fs.symlinkSync(dep, nodeModulesDep, "dir");
    }));

  console.log(
    "%c[SYNC] %cSynced dependencies with package.json",
    "color: #805ad5", "color: green", "color: blue", "color: green");
};
export default function add(prog) {
  prog.command("sync")
    .describe("Sync dependencies with package.json")
    .action(sync);
}
