import NativeImport from "../../imports/nativeImport.js";
import {followRedirect, URLToFile} from "../../imports/URLImportInstaller.js";
export let sync = async (smt, dir) => {
  let fs = await NativeImport("node:fs");
  let path = await NativeImport("node:path");
  if (!fs.existsSync(path.join(dir || process.cwd(), ".reecfg"))) {
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
        recursive : true,
      });
      fs.writeFileSync(path.join(dir || process.cwd(), ".reejs", "deps", key,
                                 "package.json"),
                       JSON.stringify({
                         name : key,
                         version : "1.0.0",
                         main : "index.js",
                         type : "module",
                       },
                                      null, 2));
      let code = fs.readFileSync(
          path.join(dir || process.cwd(), ".reejs", "cache", value));
      // simple check to check whether main file exports	default or not
      code = code.includes("export { default }");
      // numSlash is the number of slashes in key
      let numSlash = key.split("/").length - 1;
      // if numSlash is 1, numSlash = ../, if numSlash is 2, numSlash = ../../
      // etc.
      numSlash = "../".repeat(numSlash);
      fs.writeFileSync(
          path.join(dir || process.cwd(), ".reejs", "deps", key, "index.js"),
          `export * from "../../${numSlash}cache/${value}";${
              code ? `export {default} from "../../${numSlash}cache/${value}"`
                   : ""}`);
    }
    // depKey is the key of the dependency in package.json. if the depKey
    // startsWith @, allow only one "/" and the next word after that "/".
    // otherwise remove the "/" and only keep the first word
    let depKey = key.startsWith("@")
                     ? key.split("/")[0] + "/" + key.split("/")[1]
                     : key.split("/")[0];
    console.log(depKey);
    deps[depKey] = `file:./.reejs/deps/${depKey}`;
  }));
  pkgJson.dependencies = deps;
  fs.writeFileSync(path.join(dir || process.cwd(), "package.json"),
                   JSON.stringify(pkgJson, null, 2));
  fs.writeFileSync(path.join(dir || process.cwd(), "import_map.json"),
                   JSON.stringify(import_map, null, 2));
  console.log(
      "%c[REEJS] %cSynced dependencies with package.json. Run %cnpm install%c or something similar to it if you use any other package manager to link them.",
      "color: #805ad5", "color: green", "color: blue", "color: green");
};
export default function add(prog) {
  prog.command("sync")
      .describe("Sync dependencies with package.json")
      .action(sync);
}
