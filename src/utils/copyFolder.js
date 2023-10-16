import NativeImport from "@reejs/imports/nativeImport.js";
let fs = await NativeImport("node:fs");
let path = await NativeImport("node:path");

let MODIFIED_FILES = [];
//check if .reejs/serve.cache exists
if (!fs.existsSync(path.join(".reejs", "copy.cache"))) {
  if (fs.existsSync("reecfg.json")) {
    if (!fs.existsSync(".reejs")) fs.mkdirSync(".reejs");
    fs.writeFileSync(path.join(".reejs", "copy.cache"), "[]");
  }
}

async function copyFolder(source, target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target);
  }

  await Promise.all(
    fs.readdirSync(source).map(async file => {
      const filePath = path.join(source, file);
      const targetPath = path.join(target, file);
      if (filePath.endsWith("serve.cache")) return;
      if (filePath.endsWith("copy.cache")) return;
      if (filePath.endsWith("files.cache")) return;
      let stat = fs.statSync(filePath);
      if (stat.isFile()) {
        if (
          globalThis?.process?.env?.PSC_DISABLE != "true" &&
          globalThis?.Deno?.env?.get("PSC_DISABLE") != "true"
        ) {
          // check if the file was modified, by comparing the mtime
          let mtime = stat.mtimeMs;
          let modified = MODIFIED_FILES.find(e => e.f == filePath);
          if (modified && modified.at == mtime) {
            return;
          }
        }
        //add savedAt to MODIFIED_FILES array as {file: savedAt, at: mtime} where mtime is the mtime of the file
        MODIFIED_FILES.push({ f: filePath, at: stat.mtimeMs });
        //run fs async save MODIFIED_FILES as it should not block the main thread
        fs.copyFileSync(filePath, targetPath);
        if (fs.existsSync("reecfg.json")) {
          await fs.writeFile(
            path.join(".reejs", "copy.cache"),
            JSON.stringify(MODIFIED_FILES),
            () => {}
          );
        }
      } else {
        await copyFolder(filePath, targetPath);
      }
    })
  );
}

export default copyFolder;
