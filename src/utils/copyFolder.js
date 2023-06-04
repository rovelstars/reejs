import NativeImport from "@reejs/imports/nativeImport.js";
let fs = await NativeImport("node:fs");
let path = await NativeImport("node:path");

let processCwd = globalThis?.process?.cwd?.() || Deno.cwd();

let MODIFIED_FILES;
if (!fs.existsSync(path.join(".reejs", "copy.cache"))) {
  fs.writeFileSync(path.join(".reejs", "copy.cache"), "[]");
}
try {
  MODIFIED_FILES = JSON.parse(fs.readFileSync(path.join(".reejs", "copy.cache")).toString());
} catch (_) {
  MODIFIED_FILES = [];
}
//empty fn as cb for fs async
let ef = () => { };
async function copyFolder(source, target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target);
  }

  let stuff = fs.readdirSync(source);
  let then = Date.now();
  await Promise.all(stuff.map(async (file) => {
    const filePath = path.join(source, file);
    if (filePath.endsWith(".reejs/copy.cache") || filePath.endsWith(".reejs/serve.cache") || filePath.endsWith(".reejs/files.cache") || filePath.endsWith(".reejs/cache/cache.json")) return; //it changes everytime.
    const targetPath = path.join(target, file);
    await fs.stat(filePath, async (err, stat) => {
    if (!stat.isFile()) {
      await copyFolder(filePath, targetPath);
    } else {
      if (globalThis?.process?.env?.PSC_DISABLE != "true" && globalThis?.Deno?.env?.get("PSC_DISABLE") != "true") {
        // check if the file was modified, by comparing the mtime
        let mtime = stat.mtimeMs;
        let modified = MODIFIED_FILES.find((e) => e.f == filePath.replace(processCwd + "/", ""));
        if (modified && modified.at == mtime) {
          return;
        };
      }

      if (globalThis?.process?.env?.DEBUG || globalThis?.Deno?.env?.get("DEBUG"))
        console.log("%c[PACKIT] %cCopy%c" + filePath + "%cfinished in %c" + (Date.now() - then) + "ms", "color: #db2777", "color: #ffffff", "color: #10b981", "color: #ffffff", "color: #10b981");
        //remove the old file from MODIFIED_FILES array if it exists
      MODIFIED_FILES = MODIFIED_FILES.filter((e) => e.f != filePath.replace(processCwd + "/", ""));
      //add savedAt to MODIFIED_FILES array as {file: savedAt, at: mtime} where mtime is the mtime of the file
      MODIFIED_FILES.push({ f: filePath.replace(processCwd + "/", ""), at: stat.mtimeMs });
      //run fs async save MODIFIED_FILES as it should not block the main thread
      fs.copyFile(filePath, targetPath, ef);
    }
  });
  }));
  await fs.writeFile(
    path.join(".reejs", "copy.cache"),
    JSON.stringify(MODIFIED_FILES), ef);
}


//write an async function that checks whether the file is file or folder, should use async fs
//if it is a folder, call the function again with the folder path
//if it is a file, copy it to the target path, respect cache



export default copyFolder;
