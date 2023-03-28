// I consider special files as the files that ends with .jsx, .ts and .tsx and
// maybe others.

import DynamicImport from "./dynamicImport.js";
import NativeImport from "./nativeImport.js";
let fs = await NativeImport("node:fs");
let path = await NativeImport("node:path");
let crypto = await NativeImport("node:crypto");
import {Import} from "./URLImport.js";
import dl from "./URLImportInstaller.js";
let terser = await Import("terser@5.16.6");
let reejsDir = path.join(process.cwd(), ".reejs");
if (!fs.existsSync(path.join(reejsDir, "serve"))) {
  fs.mkdirSync(path.join(reejsDir, "serve"), {recursive : true});
}
let importmap =
    fs.existsSync(path.join(process.env.PWD, "import_map.json"))
        ? DynamicImport(await import(`${process.env.PWD}/import_map.json`, {
            assert: {type: "json"},
          }))
        : {};
let cachemap = fs.existsSync(path.join(process.env.PWD, "cache.json"))
                   ? DynamicImport(await import(
                         `${process.env.PWD}/.reejs/cache/cache.json`, {
                           assert: {type: "json"},
                         }))
                   : {};
let react = importmap.imports?.react || importmap.browserImports?.react;

export default async function SpecialFileImport(file) {
  // usage: let routeData = SpecialFileImport(path.join(pagesDir, page));
  // this imports sucrase and returns the result of sucrase.transform
  let sucrase = await Import("sucrase@3.29.0");
  let ext = file?.split(".")?.pop();
  let code = fs.readFileSync(file).toString();
  let transforms = ext === "jsx"   ? [ "jsx" ]
                   : ext === "ts"  ? [ "typescript" ]
                   : ext === "tsx" ? [ "typescript", "jsx" ]
                                   : [];
  let result;
  try {
    result = (await terser.minify(
                  `import React from "../cache/${cachemap[react]}";\n` +
                      sucrase
                          .transform(code, {
                            transforms,
                          })
                          .code,
                  {
                    module : true,
                    compress : {},
                    mangle : {},
                    output : {},
                    parse : {},
                    rename : {},
                  }))
                 .code +
             `\n//# sourceURL=${file.replace(process.cwd(), ".")}`;
  } catch (e) {
    throw new Error(`Error while transforming ${file} with sucrase: ${e}`);
  }
  // save it to reejsDir/serve/[hash].js
  let savedAt =
      path.join(reejsDir, "serve",
                crypto.createHash("sha256").update(file).digest("hex") + ".js");
  fs.writeFileSync(savedAt, result);
  return savedAt;
}
