import NativeImport from "@reejs/imports/nativeImport.js";
import dl, {
  followRedirect,
  URLToFile,
} from "@reejs/imports/URLImportInstaller.js";
import { Import } from "@reejs/imports/URLImport.js";
import extractInfoFromUrl from "./utils/extractInfoFromUrl.js";
let fs = await NativeImport("node:fs");
let path = await NativeImport("node:path");
let processCwd = globalThis?.process?.cwd?.() || Deno.cwd();
async function getPackageInfo(name, url, cacheFile, forNodeModules) {
  let info = await extractInfoFromUrl(url);
  let mapData = await extractInfoFromUrl("https://example.com/" + name);

  let folder = path.join(
    forNodeModules ? "node_modules" : ".reejs/deps",
    mapData.name
  );
  info.at = folder;
  info.folder = mapData.folder;
  info.isScoped = mapData.isScoped;
  info.file = mapData.file;
  info.name = mapData.name;
  return info;
}

// import and re-export file from .reejs/cache/* to .reejs/deps/<package name>
async function setupPackage(
  name,
  url,
  cacheFile,
  forNodeModules,
  fixVersion,
  blacklistNPM
) {
  let info = await getPackageInfo(name, url, cacheFile, forNodeModules);
  if (blacklistNPM?.includes(info.name)) return;
  if (!fs.existsSync(info.at)) fs.mkdirSync(info.at, { recursive: true });
  if (!fs.existsSync(path.join(info.at, "package.json")))
    fs.writeFileSync(
      path.join(info.at, "package.json"),
      JSON.stringify(
        {
          name: info.name,
          version: fixVersion?.[name] || info.version,
          main: "index.js",
          type: "module",
        },
        null,
        2
      )
    );
  if (info.file != "index.js") {
    //package exists. read and continue from there.
    let pkgJson = JSON.parse(
      fs.readFileSync(path.join(info.at, "package.json"), "utf-8")
    );
    if (!pkgJson.exports) pkgJson.exports = { ".": "./index.js" };
    pkgJson.exports["./" + info.file.substring(0, info.file.lastIndexOf("."))] =
      "./" + info.file;
    fs.writeFileSync(
      path.join(info.at, "package.json"),
      JSON.stringify(pkgJson, null, 2)
    );
  }
  if (!fs.existsSync(path.join(info.at, info.file))) {
    if (!fs.existsSync(path.join(".reejs", "cache")))
      fs.mkdirSync(path.join(".reejs", "cache"), { recursive: true });
    let code;
    try {
      code = fs.readFileSync(path.join(".reejs", "cache", cacheFile), "utf-8");
    } catch (e) {
      console.log(e);
      console.log(
        "%c[SYNC] %cError: %cDependency %c`" +
          info.name +
          "`%c not found in cache.\nPlease run %c`reejs add`%c to first download the dependencies",
        "color: red",
        "color: yellow",
        "color: red",
        "color: blue",
        "color: red",
        "color: blue",
        "color: red"
      );
      process.exit(0);
    }
    if (info.folder && !fs.existsSync(path.join(info.at, info.folder)))
      fs.mkdirSync(path.join(info.at, info.folder), { recursive: true });
    let countBackToFile =
      "../".repeat(
        (info?.folder?.split?.("/")?.length || 1) + info.name.split("/").length
      ) +
      `${forNodeModules ? ".reejs/" : ""}cache/` +
      cacheFile;
    let hasDefaultExport =
      code.includes("export default") ||
      code.includes("export {default}") ||
      code.includes("export { default }");
    fs.writeFileSync(
      path.join(info.at, info.file),
      `export * from "${countBackToFile}";${
        hasDefaultExport
          ? `\nexport { default } from "${countBackToFile}";`
          : ""
      }`
    );
  }
  return { name: info.name, at: info.at };
}

export let sync = async (smt, dir) => {
  if (!fs.existsSync(path.join(dir || processCwd, "reecfg.json"))) {
    console.log(
      "%c[REEJS] %cThis is not a reejs project!",
      "color: red",
      "color: yellow"
    );
    return;
  }
  let pkgJson = JSON.parse(fs.readFileSync("package.json", "utf-8"));
  let import_map = JSON.parse(fs.readFileSync("import_map.json", "utf-8"));
  let deps = pkgJson.dependencies || {};
  await Promise.all(
    Object.keys(import_map.imports)
      .sort((a, b) => a.localeCompare(b))
      .map(async key => {
        let urldest = import_map.imports[key];
        if (!urldest.startsWith("https://") && !urldest.startsWith("http://"))
          return;
        let value = (await dl(urldest, true)).split("/").pop();
        let savedAt = await setupPackage(
          key,
          urldest,
          value,
          false,
          import_map.fixVersion,
          import_map.blacklistNPM
        );
        await setupPackage(
          key,
          urldest,
          value,
          true,
          import_map.fixVersion,
          import_map.blacklistNPM
        );
        //add it to package.json
        if (savedAt && !deps[savedAt.name]) {
          deps[savedAt.name] = "*";
          //"file:" + savedAt.at;
        }
      })
  );
  // write to package.json
  pkgJson.dependencies = deps;
  if (!pkgJson.packageManager) pkgJson.packageManager = "npm";
  fs.writeFileSync("package.json", JSON.stringify(pkgJson, null, 2));
  let { detectPackageManager, installDependencies } = await Import(
    "npm:v132/nypm@0.3.3?bundle",
    { internalDir: true }
  );
  let packageManager = await detectPackageManager(processCwd);
  let then = Date.now();
  await installDependencies({ cwd: dir, packageManager, silent: true });
  console.log(
    `%c[SYNC] %c${packageManager.command} synced dependencies in ${
      Date.now() - then
    }ms`,
    "color: green",
    "color: blue"
  );
};

export default function add(prog) {
  prog
    .command("sync")
    .describe("Sync dependencies with package.json")
    .action(sync);
}
