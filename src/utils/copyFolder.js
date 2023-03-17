import NativeImport from "../imports/nativeImport.js";
let fs = await NativeImport("node:fs");
let path = await NativeImport("node:path");

function copyFolderSync(source, target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target);
  }

  fs.readdirSync(source).forEach((file) => {
    const filePath = path.join(source, file);
    const targetPath = path.join(target, file);

    if (fs.statSync(filePath).isFile()) {
      fs.copyFileSync(filePath, targetPath);
    } else {
      copyFolderSync(filePath, targetPath);
    }
  });
}

export default copyFolderSync;
