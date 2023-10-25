// I consider special files as the files that ends with .jsx, .ts and .tsx and
// maybe others.

import DynamicImport from "./dynamicImport.js";
import env from "./env.js";
import NativeImport from "./nativeImport.js";
import { reejsDir as dir } from "@reejs/imports/env.js";
let fs = await NativeImport("node:fs");
let path = await NativeImport("node:path");
let crypto = await NativeImport("node:crypto");
import { Import } from "./URLImport.js";
import dl, { URLToFile } from "./URLImportInstaller.js";
let terser;
let processCwd = globalThis?.process?.cwd?.() || Deno.cwd();
let reejsDir = path.join(processCwd, ".reejs");
if (
  !fs.existsSync(path.join(reejsDir, "serve")) &&
  fs.existsSync(path.join(processCwd, "reecfg.json"))
) {
  fs.mkdirSync(path.join(reejsDir, "serve"), { recursive: true });
}

let importmap = fs.existsSync(path.join(processCwd, "import_map.json"))
  ? DynamicImport(
      await import(`${processCwd}/import_map.json`, {
        assert: { type: "json" },
      })
    )
  : {};
let cachemap = fs.existsSync(path.join(dir, "cache", "cache.json"))
  ? DynamicImport(
      await import(`file://${dir}/cache/cache.json`, {
        assert: { type: "json" },
      })
    )
  : fs.existsSync(path.join(processCwd, ".reejs", "cache", "cache.json"))
  ? DynamicImport(
      await import(`file://${processCwd}/.reejs/cache/cache.json`, {
        assert: { type: "json" },
      })
    )
  : {};

let react =
  importmap.imports?.react ||
  importmap.browserImports?.react ||
  "https://esm.sh/react@18.2.0";
let lexer;

let MODIFIED_FILES;
//check if .reejs/serve.cache exists
if (!fs.existsSync(path.join(".reejs", "serve.cache"))) {
  if (fs.existsSync("reecfg.json")) {
    fs.writeFileSync(path.join(".reejs", "serve.cache"), "[]");
  }
}
try {
  MODIFIED_FILES = JSON.parse(
    fs.readFileSync(path.join(".reejs", "serve.cache")).toString()
  );
} catch (e) {
  MODIFIED_FILES = [];
}
let CURRENT_OPEN_FILES = [];

function waitUntilArrayDoesntHaveValue(element) {
  return new Promise(resolve => {
    let interval;
    let fn = () => {
      if (!CURRENT_OPEN_FILES.includes(element)) {
        clearInterval(interval);
        resolve();
      }
    };
    //fn();
    interval = setInterval(fn, 1);
  });
}

//hook up a global listener for packit fire
import { EventEmitter } from "node:events";
globalThis.packitEvent = new EventEmitter();
globalThis.packitEvent.on("start", async () => {
  //this event is fired when packit is done transpiling the files.
  //we clear the cache if PSC_DISABLE is true, and reset MODIFIED_FILES to []
  //if PSC_DISABLE is false, we save the cache to .reejs/serve.cache
  if (
    globalThis?.process?.env?.PSC_DISABLE == "true" ||
    globalThis?.Deno?.env?.get("PSC_DISABLE") == "true"
  ) {
    //we need to clear file cache.
    //fs.writeFileSync(path.join(".reejs", "serve.cache"), "[]");
    MODIFIED_FILES = [];
  }
});
globalThis.packitEvent.on("done", async () => {
  CURRENT_OPEN_FILES = []; //reset CURRENT_OPEN_FILES becoz why not lol
  if (fs.existsSync("reecfg.json")) {
    fs.writeFile(
      path.join(".reejs", "serve.cache"),
      JSON.stringify(MODIFIED_FILES),
      () => {}
    );
  }
});

// I decided its better to load modified files at boot and not inside the function, while this does slows at initial boot, subsequent calls are faster.
/*
 * @param {string} file - The file to import
 * @param {string} parentFile - The file that imports the file
 * @param {string} service - The service to transpile the file for, like `node` or `deno`
 * @param {string} code - The code of the file, optional. useful for third party transpilers who have transpiled part of the code already.
 * @returns {string} - The path to the file where it is saved
 */
export default async function SpecialFileImport(
  file,
  parentFile,
  service,
  code
) {
  if (!file) throw new Error("parameter `file` is required");
  if ((file.includes(".reejs/cache") || file.includes(".reejs/serve")) && !code)
    return file;
  if (service == "deno") service = "deno-deploy";
  file = file.replace(processCwd + "/", "");
  if ((file.startsWith("./") || file.startsWith("../")) && parentFile)
    file = path.resolve(path.join(parentFile, file));
  let ext = file?.split(".")?.pop();
  if (ext == file) {
    //get all files in the directory
    let files = fs.readdirSync(path.dirname(file));
    //find the file that starts with the file name
    let foundFile = files.find(e => e.startsWith(path.basename(file)));
    if (!foundFile) throw new Error(`File ${file} not found`);
    //set the file to the found file
    file = path.join(path.dirname(file), foundFile);
    //set the ext to the ext of the found file
    ext = foundFile.split(".").pop();
  }
  //get extname of file
  await waitUntilArrayDoesntHaveValue(file);
  // check if the file was modified,a by comparing the mtime
  let mtime = fs.statSync(path.join(processCwd, file)).mtimeMs;
  // MODIFIED_FILES looks like: [{ f: file, s: savedAt, at: mtime}]
  let modified = MODIFIED_FILES.find(e => e.f == file);
  if (modified && modified.at == mtime) {
    // the file was not modified, so we can use the cached version. Return savedAt
    return modified.s;
  }
  CURRENT_OPEN_FILES.push(file);
  if (!terser)
    terser = await Import("terser@5.16.6?bundle", { internalDir: true });
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
      parse: code => {
        let arr = p.parse(code);
        arr = arr[0].map(e => {
          return { ss: e.ss, se: e.se, n: e.n };
        });
        return Array.from(new Set(arr))
          .filter(i => !!i.n)
          .filter(i => {
            return !i.n.startsWith("node:");
          });
        //},
      },
    };
  }

  // usage: let routeData = SpecialFileImport(path.join(pagesDir, page));
  // this imports sucrase and returns the result of sucrase.transform
  let sucrase = await Import("npm:v132/sucrase@3.32.0?bundle", {
    internalDir: true,
  });
  if (ext == file)
    throw new Error(
      `\`${file}\` has no extension passed to packit transpiler.\nThis usually means the file doesn't exist, or Packit couldn't find the file.`
    );
  //if the file has no extension, the pop() will return the file name, so we throw an error

  if (!code) {
    code = fs.readFileSync(file).toString();
  }
  if (ext === "md" || ext === "mdx") {
    let compile = (
      await Import("npm:v132/@mdx-js/mdx@2.3.0?bundle", {
        internalDir: true,
      })
    ).compile;
    let rehypePlugins = [...(globalThis?.mdxPlugins || [])];
    code = (await compile(code, { jsx: true, rehypePlugins })).value;
    ext = "jsx";
  }
  let transforms =
    ext === "jsx"
      ? ["jsx"]
      : ext === "ts"
      ? ["typescript"]
      : ext === "tsx"
      ? ["typescript", "jsx"]
      : [];
  if (transforms.includes("jsx") && code.includes("ISLAND_FILENAME")) {
    // we are working for @reejs/react/island.jsx
    code = code.replace(
      "ISLAND_FILENAME",
      `__filename="${crypto
        .createHash("sha256")
        .update(parentFile)
        .digest("hex")
        .slice(0, 6)}.js"`
    );
  }
  let result;
  try {
    result = sucrase.transform(code, {
      transforms,
      /*
jsxPragma : "h",
jsxFragmentPragma : "Fragment",*/
      production: true,
    }).code;
    if (
      globalThis?.process?.env?.NODE_ENV == "production" ||
      globalThis?.Deno?.env?.get("NODE_ENV") == "production"
    ) {
      result = (
        await terser.minify(result, {
          module: true,
          compress:
            globalThis?.process?.env?.NODE_ENV == "production" ||
            globalThis?.Deno?.env?.get("NODE_ENV") == "production"
              ? {}
              : false,
          mangle: false,
          output: {},
          parse: {},
          rename: {},
        })
      ).code;
    }
  } catch (e) {
    throw new Error(`Error while transforming ${file} with sucrase: ${e}`);
  }
  let packs;
  try {
    packs = lexer.parse(result);
  } catch (e) {
    console.log("Error while parsing the file: ", file);
    console.trace(e);
  }
  // replace @reejs/react with ./node_modules/@reejs/react
  let files = await Promise.all(
    packs.map(async pack => {
      //setup vite compability -> resolveId function
      let resolvedPluginInfo;
      globalThis?.PACKIT_LOADERS?.filter?.(e => e?.resolveId)?.some?.(e => {
        let resolved = e.resolveId(pack.n, null, {}); //if it returns undefined, it means it cant resolve it. else it returns the resolved id
        /*
      Virtual modules in Vite (and Rollup) are prefixed with virtual: for the user-facing path by convention.
      If possible the plugin name should be used as a namespace to avoid collisions with other plugins in the ecosystem.
      For example, a `vite-plugin-posts` could ask users to import a `virtual:posts` or `virtual:posts/helpers` virtual modules
      to get build time information.
      Internally, plugins that use virtual modules should prefix the module ID with `\0` while resolving the id,
      a convention from the rollup ecosystem. This prevents other plugins from trying to process the id (like node resolution),
      and core features like sourcemaps can use this info to differentiate between virtual modules and regular files.
      `\0` is not a permitted char in import URLs so we have to replace them during import analysis.
      A `\0{id}` virtual id ends up encoded as `/@id/__x00__{id}` during dev in the browser.
      The id will be decoded back before entering the plugins pipeline, so this is not seen by plugins hooks code.
      
      Note that modules directly derived from a real file, as in the case of a script module in a Single File Component
      (like a .vue or .svelte SFC) don't need to follow this convention.
      SFCs generally generate a set of submodules when processed but the code in these can be mapped back to the filesystem.
      Using \0 for these submodules would prevent sourcemaps from working correctly.
      */
        if (resolved) {
          resolvedPluginInfo = { name: e.name, resolved };
          return true;
        }
        return false;
      });
      if (resolvedPluginInfo?.resolved) {
        if (
          globalThis?.process?.env?.DEBUG ||
          globalThis?.Deno?.env?.get("DEBUG")
        )
          console.log(
            `%c[DEBUG] %c${pack.n} %cwas resolved by %c${resolvedPluginInfo.name} %cto %c${resolvedPluginInfo.resolved}`,
            "color: yellow",
            "color: blue",
            "color: gray",
            "color: blue",
            "color: gray",
            "color: blue"
          );

        //since the plugin resolved the id, we need to load the file from the plugin
        let loader = globalThis.PACKIT_LOADERS.filter(
          e => e.name == resolvedPluginInfo.name
        )[0];
        let outputOfLoader = await loader?.load?.(resolvedPluginInfo.resolved);
        if (outputOfLoader) {
          //save the file to .reejs/loaders/<loader.name>/<urlToFile(pack.n)>
          let loaderDir = path.join(".reejs", "serve", "loaders", loader.name);
          if (!fs.existsSync(loaderDir)) {
            fs.mkdirSync(loaderDir, { recursive: true });
          }
          let loaderFile = path.join(loaderDir, URLToFile(pack.n, true));
          fs.writeFileSync(
            loaderFile + ".js",
            outputOfLoader.code || outputOfLoader
          );
          return `../serve/loaders/${path.join(
            loader.name,
            URLToFile(pack.n, true)
          )}.js`;
        }
      }
      if (pack.n == "vite" && file.endsWith("packit.config.js")) {
        globalThis.VITE_PLUGIN_STARTED = Date.now();
        if (!fs.existsSync(path.join(".reejs", "packit", "vite", "index.js"))) {
          fs.mkdirSync(path.join(".reejs", "packit", "vite"), {
            recursive: true,
          });
          fs.writeFileSync(
            path.join(".reejs", "packit", "vite", "index.js"),
            `import * as cheerio from "${
              "../.." +
              (
                await dl("https://esm.sh/cheerio@1.0.0-rc.12/lib/slim", true)
              ).split(".reejs")[1]
            }";` +
              fs
                .readFileSync(
                  path.dirname(import.meta.url).replace("file://", "") +
                    "/vite.js"
                )
                .toString()
          );
        }
        return "../packit/vite/index.js";
      }
      if (pack.n.startsWith("npm:")) {
        if (
          fs.existsSync(path.join(".reejs", "cache", URLToFile(pack.n, true)))
        )
          return "../cache/" + path.join(URLToFile(pack.n, true));
        let savedAt = await dl(
          pack.n.replace(
            "npm:",
            (process.env.ESM_SERVER || "https://esm.sh") + "/"
          ),
          true
        );
        return "../cache/" + savedAt.split("cache/")[1];
      } else if (pack.n.startsWith("https:")) {
        if (
          fs.existsSync(path.join(".reejs", "cache", URLToFile(pack.n, true)))
        )
          return "../cache/" + path.join(URLToFile(pack.n, true));
        let savedAt = await dl(pack.n, true);
        return "../cache/" + savedAt.split("cache/")[1];
      } else if (importmap.imports?.[pack.n]) {
        return `../cache/${
          cachemap[
            importmap.imports?.[pack.n] +
              "|" +
              (globalThis.process?.env?.REEJS_UA ||
                globalThis.Deno?.env?.get("REEJS_UA"))
          ]
        }`;
      } else if (importmap.browserImports?.[pack.n]) {
        return `../cache/${
          cachemap[
            importmap.browserImports[pack.n] +
              "|" +
              (globalThis.process?.env?.REEJS_UA ||
                globalThis.Deno?.env?.get("REEJS_UA"))
          ]
        }`;
      } else if (pack.n.startsWith("./") || pack.n.startsWith("../")) {
        //return pack.n;
        let ppack = pack.n;
        if (pack.n.includes("../.reejs/cache"))
          pack.n = pack.n.replace("../.reejs/cache", ".reejs/cache");
        let availableFilesInsideNodeModules = fs
          .readdirSync(
            path.join(
              file.split("/").slice(0, -1).join("/"),
              pack.n.startsWith("../")
                ? pack.n.split("/").slice(0, -1).join("/")
                : "."
            )
          )
          .filter(
            e =>
              (e.endsWith(".ts") ||
                e.endsWith(".tsx") ||
                e.endsWith(".js") ||
                e.endsWith(".jsx") ||
                e.endsWith(".md") ||
                e.endsWith(".mdx")) &&
              !e.endsWith(".d.ts")
          );
        let packFileName = pack.n.split("/").pop();
        let TheFile = availableFilesInsideNodeModules.find(e =>
          e.startsWith(packFileName.split(".")[0])
        );
        ppack = ppack.replace(packFileName, TheFile);
        if (ppack.endsWith("undefined")) {
          ppack = pack.n;
        }
        let copypackn = pack.n.startsWith(".")
          ? path.resolve(path.join(path.dirname(file), ppack))
          : ppack;
        if (globalThis?.PACKIT_LOADERS?.length) {
          for (let loader of globalThis.PACKIT_LOADERS) {
            let outputOfLoader = await loader?.load?.(copypackn);
            if (outputOfLoader) {
              //save the file to .reejs/loaders/<loader.name>/<urlToFile(pack.n)>
              let loaderDir = path.join(
                ".reejs",
                "serve",
                "loaders",
                loader.name
              );
              if (!fs.existsSync(loaderDir)) {
                fs.mkdirSync(loaderDir, { recursive: true });
              }
              let loaderFile = path.join(loaderDir, URLToFile(pack.n, true));
              fs.writeFileSync(
                loaderFile + ".js",
                outputOfLoader.code || outputOfLoader
              );
              return `../serve/loaders/${path.join(
                loader.name,
                URLToFile(pack.n, true)
              )}.js`;
            }
          }
        }
        let reactFile;
        try {
          reactFile =
            "./" +
            path
              .join(
                reejsDir,
                "serve",
                (
                  await SpecialFileImport(
                    path.join(file.split("/").slice(0, -1).join("/"), ppack),
                    file,
                    service
                  )
                ).split("serve/")[1]
              )
              .split("serve/")[1];
        } catch (e) {
          console.log("Error while importing file: ", file, ppack);
          throw e;
        }
        return reactFile;
      } else {
        // check if package is in the node_modules
        try {
          if (
            fs.existsSync(
              path.join(processCwd, "node_modules", pack.n.split("/")[0])
            )
          ) {
            let ppack = pack.n;
            if (pack.n.includes("__reejs") || pack.n.includes(".reejs"))
              return pack.n;
            let availableFilesInsideNodeModules = fs
              .readdirSync(path.join("./node_modules", path.dirname(pack.n)))
              .filter(
                e =>
                  (e.endsWith(".ts") ||
                    e.endsWith(".tsx") ||
                    e.endsWith(".js") ||
                    e.endsWith(".jsx") ||
                    e.endsWith(".md") ||
                    e.endsWith(".mdx")) &&
                  !e.endsWith(".d.ts")
              );
            let packFileName = pack.n.split("/").pop();
            let TheFile = availableFilesInsideNodeModules.find(e =>
              e.startsWith(packFileName.split(".")[0])
            );
            if (!TheFile)
              return service == "deno-deploy"
                ? `../../node_modules/${pack.n}`
                : pack.n;
            ppack = ppack.replace(packFileName, TheFile);
            if (ppack.endsWith("undefined")) {
              ppack = pack.n;
            }
            let reactFile;
            try {
              reactFile =
                "./" +
                path
                  .join(
                    reejsDir,
                    "serve",
                    (
                      await SpecialFileImport(
                        path.join("./node_modules", ppack),
                        file,
                        service
                      )
                    ).split("serve/")[1]
                  )
                  .split("serve/")[1];
              return reactFile;
            } catch (e) {
              console.log(e);
              return pack.n;
            }
          }
        } catch (e) {
          // sssh... it was probably a third party package which we dont care now.
          return pack.n;
        }
      }
    })
  );
  packs.map(async (p, i) => {
    if (files[i]?.endsWith("undefined")) {
      return;
    }
    result = result
      .replace(`from "${p.n}"`, `from "${files[i]}"`)
      .replace(`from '${p.n}'`, `from '${files[i]}'`)
      .replace("from `" + p.n + "`", "from `" + files[i] + "`")
      //take account of no spaces between from and "
      .replace(`from"${p.n}"`, `from"${files[i]}"`)
      .replace(`from'${p.n}'`, `from'${files[i]}'`)
      .replace("from`" + p.n + "`", "from`" + files[i] + "`")
      //take account of import "package-name"
      .replace(`import "${p.n}"`, `import "${files[i]}"`)
      .replace(`import '${p.n}'`, `import '${files[i]}'`)
      .replace("import `" + p.n + "`", "import `" + files[i] + "`")
      //take account of no spaces between import and "
      .replace(`import"${p.n}"`, `import"${files[i]}"`)
      .replace(`import'${p.n}'`, `import'${files[i]}'`)
      .replace("import`" + p.n + "`", "import`" + files[i] + "`");
  });
  if (
    (result.includes("React.createElement") ||
      result.includes("React.createFragment") ||
      result.includes("React.Component")) &&
    !result.includes("import React from") &&
    !result.includes("import * as React from") &&
    !result.includes("import*as React from") &&
    !result.includes("import React, {") &&
    !result.includes("import React,{")
  ) {
    result =
      `import React from "${
        cachemap[
          react +
            "|" +
            (globalThis.process?.env?.REEJS_UA ||
              globalThis.Deno?.env?.get("REEJS_UA"))
        ]
          ? `../cache/${
              cachemap[
                react +
                  "|" +
                  (globalThis.process?.env?.REEJS_UA ||
                    globalThis.Deno?.env?.get("REEJS_UA"))
              ]
            }`
          : await dl(react, true)
      }";\n` + result;
  }
  result += "\n//# sourceURL=file://" + file.replace(processCwd, ".");
  // save it to reejsDir/serve/[hash].js
  let savedAt = path.join(
    globalThis?.process?.env?.USED_BY_CLI_APP ? dir : ".reejs",
    "serve",
    crypto.createHash("sha256").update(file).digest("hex").slice(0, 6) + ".js"
  );
  //remove the old file from MODIFIED_FILES array if it exists
  MODIFIED_FILES = MODIFIED_FILES.filter(e => e.f != file);
  //add savedAt to MODIFIED_FILES array as {file: savedAt, at: mtime} where mtime is the mtime of the file
  MODIFIED_FILES.push({ f: file, s: savedAt, at: fs.statSync(file).mtimeMs });
  if (!fs.existsSync(path.dirname(savedAt)))
    fs.mkdirSync(path.dirname(savedAt), { recursive: true });
  fs.writeFileSync(savedAt, result);
  CURRENT_OPEN_FILES = CURRENT_OPEN_FILES.filter(e => e != file);
  return savedAt;
}
