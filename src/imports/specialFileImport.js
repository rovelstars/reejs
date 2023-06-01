// I consider special files as the files that ends with .jsx, .ts and .tsx and
// maybe others.

import DynamicImport from "./dynamicImport.js";
import env from "./env.js";
import NativeImport from "./nativeImport.js";

let fs = await NativeImport("node:fs");
let path = await NativeImport("node:path");
let crypto = await NativeImport("node:crypto");
import { Import } from "./URLImport.js";
import dl from "./URLImportInstaller.js";
let terser;
let processCwd = globalThis?.process?.cwd?.() || Deno.cwd();
let reejsDir = path.join(processCwd, ".reejs");
if (!fs.existsSync(path.join(reejsDir, "serve")) &&
  fs.existsSync(path.join(processCwd, ".reecfg.json"))) {
  fs.mkdirSync(path.join(reejsDir, "serve"), { recursive: true });
}

let importmap =
  fs.existsSync(path.join(processCwd, "import_map.json"))
    ? DynamicImport(await import(`${processCwd}/import_map.json`, {
      assert: { type: "json" },
    }))
    : {};
let cachemap = fs.existsSync(path.join(reejsDir, "cache", "cache.json"))
  ? DynamicImport(await import(
    `${processCwd}/.reejs/cache/cache.json`, {
    assert: { type: "json" },
  }))
  : {};
let react = importmap.imports?.react || importmap.browserImports?.react;
let lexer;
export default async function SpecialFileImport(file, parentFile, service) {
  if (!terser)
    terser = await Import("terser@5.16.6");
  if (!lexer) {
    /*
if (env == "bun") {
console.log(
    "[BUN] Using Native Features that are faster than the polyfills!");
let transpiler = new Bun.Transpiler();
lexer = {
  parse : (code) => {
    let _imports = transpiler.scanImports(code);
    _imports = _imports.map((e) => e.path);
    return [ _imports ].filter((e) => { return !e.startsWith("node:"); });
  },
}
} else {*/
    let p = await import("./lexer.js");
    await p.init;
    lexer = {
      parse: (code) => {
        let arr = p.parse(code);
        arr = arr[0].map((e) => { return { ss: e.ss, se: e.se, n: e.n } });
        return Array.from(new Set(arr))
          .filter((i) => !!i.n)
          .filter((i) => { return !i.n.startsWith("node:"); });
        //},
      }
    }
  }

  // usage: let routeData = SpecialFileImport(path.join(pagesDir, page));
  // this imports sucrase and returns the result of sucrase.transform
  let sucrase = await Import("sucrase@3.29.0");
  let ext = file?.split(".")?.pop();
  let code = fs.readFileSync(file).toString();
  if (ext === "md") {
    let compile = (await Import("@mdx-js/mdx@2.3.0")).compile;
    code = (await compile(code, { jsx: true })).value;
    ext = "jsx";
  }
  let transforms = ext === "jsx" ? ["jsx"]
    : ext === "ts" ? ["typescript"]
      : ext === "tsx" ? ["typescript", "jsx"]
        : [];
  if (transforms.includes("jsx") && code.includes("ISLAND_FILENAME")) {
    // we are working for @reejs/react/island.jsx
    code = code.replace("ISLAND_FILENAME", `__filename="${crypto.createHash("sha256")
        .update(parentFile)
        .digest("hex")
        .slice(0, 6)}.js"`);
  }
  let result;
  try {
    result = sucrase.transform(code, {
      transforms,
      /*
jsxPragma : "h",
jsxFragmentPragma : "Fragment",*/
      production: true
    })
      .code;
      if(globalThis?.process?.env?.NODE_ENV == "production" || globalThis?.Deno?.env?.get("NODE_ENV") == "production"){
    result = (await terser.minify(result,
      {
        module: true,
        compress: (globalThis?.process?.env?.NODE_ENV == "production" || globalThis?.Deno?.env?.get("NODE_ENV") == "production") ? {} : false,
        mangle: false,
        output: {},
        parse: {},
        rename: {},
      }))
      .code;
    }
  } catch (e) {
    throw new Error(`Error while transforming ${file} with sucrase: ${e}`);
  }
  let packs;
  try {
    packs = lexer.parse(result);
  } catch (e) {
    console.log("Error while parsing the file: ", file);
    throw e;
  }
  // replace @reejs/react with ./node_modules/@reejs/react
  let files = await Promise.all(packs.map(async (pack) => {
    if (pack.n.startsWith("@reejs/react")) {
      let ppack = pack.n;
      let availableFilesInsideNodeModules =
        fs.readdirSync(
          path.join(processCwd, "node_modules", "@reejs", "react"))
          .filter((e) => e.endsWith(".ts") || e.endsWith(".tsx") ||
            e.endsWith(".js") || e.endsWith(".jsx") || e.endsWith(".md"));
      let packFileName = pack.n.split("/").pop();
      let TheFile = availableFilesInsideNodeModules.find(
        (e) => e.startsWith(packFileName.split(".")[0]));
      //console.log(ppack, packFileName, TheFile)
      ppack = ppack.replace(packFileName, TheFile);
      // compile the react file and save in .reejs/serve
      let reactFile =
        /*(service == "deno-deploy")
            ? ("../../node_modules/" + ppack)
            :*/
        ("./" +
          path.join(reejsDir, "serve",
            (await SpecialFileImport(
              path.join(processCwd, "node_modules", ppack), file,
              service))
              .split("serve/")[1])
            .split("serve/")[1]);
      return reactFile;
    } else if (pack.n.startsWith("./") || pack.n.startsWith("../")) {
      let ppack = pack.n;
      let availableFilesInsideNodeModules =
        fs
          .readdirSync(path.join(
            file.split("/").slice(0, -1).join("/"),
            (pack.n.startsWith("../")
              ?
              // pack.n tries to go to the parent directory.
              // change pack.n value from "../file name" to "../"
              pack.n.split("/").slice(0, -1).join("/")
              : ".")))
          .filter((e) => e.endsWith(".ts") || e.endsWith(".tsx") ||
            e.endsWith(".js") || e.endsWith(".jsx") || e.endsWith(".md"));
      let packFileName = pack.n.split("/").pop();
      let TheFile = availableFilesInsideNodeModules.find(
        (e) => e.startsWith(packFileName.split(".")[0]));
      ppack = ppack.replace(packFileName, TheFile);
      if (ppack.endsWith("undefined")) {
        ppack = pack.n;
      }
      let reactFile;
      try {
        reactFile =
          /*  (service == "deno-deploy")
                ? ("../../" + path.join(file.split("/").slice(0,
             -1).join("/"), pack.n.split("/").slice(0, -1).join("/"),
                                        TheFile)
                                  .replace(processCwd, ""))
                      .replace("//", "/")
                :*/
          "./" +
          path.join(
            reejsDir, "serve",
            (await SpecialFileImport(
              path.join(file.split("/").slice(0, -1).join("/"), ppack),
              null, service))
              .split("serve/")[1])
            .split("serve/")[1];
      } catch (e) {
        console.log("Error while importing file: ", file, ppack);
      }
      return reactFile;
    } else {
      // check if package is in the import map
      if (importmap.imports[pack.n]) {
        return (service != "deno-deploy")
          ? `../cache/${cachemap[importmap.imports[pack.n]]}`
          : importmap.imports[pack.n];
      } else if (importmap.browserImports[pack.n]) {
        return (service != "deno-deploy")
          ? `../cache/${cachemap[importmap.browserImports[pack.n]]}`
          : importmap.browserImports[pack.n];
      } else {
        return pack.n;
      }
    }
  }));
  packs.map((p, i) => { result = result.replace(p.n, files[i]); });
  if (result.includes("React")) {
    result =
      `import React from "${(cachemap[react]) ? `../cache/${cachemap[react]}` : react}";\n` +
      result;
  }
  result += "\n//# sourceURL=" + file.replace(processCwd,".");
  // save it to reejsDir/serve/[hash].js
  let savedAt = path.join(
    reejsDir, "serve",
    crypto.createHash("sha256").update(file).digest("hex").slice(0, 6) +
    ".js");
  fs.writeFileSync(savedAt, result);
  return savedAt;
}
