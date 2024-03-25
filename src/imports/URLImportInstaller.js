// this file allows you to download files from a URL.
import env, { dirname } from "./env.js";
import { reejsDir as dir, runtime } from "./env.js";
import NativeImport from "./nativeImport.js";
import { Import } from "./URLImport.js";
if (runtime == "browser") {
  throw new Error(
    "URLImportInstaller.js is not for edge/browsers. Install them via reejs cli and use them."
  );
}
let _reejsDir = dir; // make reejsDir mutable
let fs = await NativeImport("node:fs");
let path = await NativeImport("node:path");
let https = await NativeImport("node:https");
let http = await NativeImport("node:http");
let crypto = await NativeImport("node:crypto");
import styleit from "@reejs/utils/log.js";
import DynamicImport from "./dynamicImport.js";
import URLImport from "./URLImport.js";
import { save } from "./debug.js";
import getJSR_URL from "./jsr.js";

let processCwd = globalThis?.process?.cwd?.() || Deno.cwd();

if (
  !fs.existsSync(path.join(_reejsDir, "cache")) &&
  fs.existsSync(path.join(processCwd, "reecfg.json"))
) {
  fs.mkdirSync(path.join(_reejsDir, "cache"), { recursive: true });
  fs.writeFileSync(
    path.join(_reejsDir, "cache", "package.json"),
    JSON.stringify({ type: "module" })
  );
}
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    let chosen = url.startsWith("https:") ? https : http;
    chosen
      .get(url, res => {
        let data = "";
        res.on("data", chunk => {
          data += chunk;
        });
        res.on("end", () => {
          resolve(data);
        });
      })
      .on("error", err => {
        reject(err);
      });
  });
}
if (!fs.existsSync(path.join(_reejsDir, "failsafe"))) {
  fs.mkdirSync(path.join(_reejsDir, "failsafe"), { recursive: true });
}
if (!fs.existsSync(path.join(_reejsDir, "failsafe", "package.json")))
  fs.writeFileSync(
    path.join(_reejsDir, "failsafe", "package.json"),
    JSON.stringify({ type: "module" })
  );
//check if fetch is available or not. if not, use nativeimport https module to download the file, save it at reejsDir/failsafe/fetch.js and import it.
if (!globalThis.fetch) {
  if (!fs.existsSync(path.join(_reejsDir, "failsafe", "fetch.js"))) {
    let fetchFileCode = await fetchUrl(
      `${
        process.env.ESM_SERVER || "https://esm.sh"
      }/v128/node-fetch@3.3.1/node/node-fetch.bundle.mjs`
    );
    fs.writeFileSync(
      path.join(_reejsDir, "failsafe", "fetch.js"),
      fetchFileCode
    );
  }
  globalThis.fetch = (
    await import("file://" + path.join(_reejsDir, "failsafe", "fetch.js"))
  ).default;
}

// user agent
export let UA;
let pkgJson = DynamicImport(await import("./version.js")).reejs;
switch (env) {
  case "node":
    UA = `Node/${process.version} (reejs/${pkgJson.version})`;
    break;
  case "deno":
    //UA = `Deno/${Deno.version.deno} (reejs/${pkgJson.version})`;
    //TODO: wait for esm.sh to fix using the above way
    UA = `Deno/${Deno.version.deno}`;
    break;
  case "browser":
    UA = `Mozilla/5.0 (reejs/${pkgJson.version})`; // I got no idea why I did this. Sounds villainous. I can confirm lol~
    break;
  case "bun":
    UA = `Bun/${Bun.version} (reejs/${pkgJson.version})`;
    break;
}

//check if env has REEJS_UA and if it does, use it instead of the default one.

if (
  (globalThis.process?.env?.REEJS_UA ||
    globalThis.Deno?.env?.get("REEJS_UA")) &&
  (globalThis.process?.env?.REEJS_UA ||
    globalThis.Deno?.env?.get("REEJS_UA")) != UA
) {
  UA =
    globalThis.process?.env?.REEJS_UA || globalThis.Deno?.env?.get("REEJS_UA");
  console.log(
    `%c[REEJS] %cUsing custom user agent: %c${UA}`,
    "color: #805ad5",
    "color: gray",
    "color: green"
  );
}

globalThis.__CACHE_SHASUM = {};

let importmap;
if (fs.existsSync(path.join(processCwd, "import_map.json"))) {
  importmap = JSON.parse(
    fs.readFileSync(path.join(processCwd, "import_map.json"), "utf8")
  );
}

let react =
  importmap?.imports?.react ||
  importmap?.browserImports?.react ||
  "https://esm.sh/react@18.2.0";

let URLToFile = function (url, noFolderPath = false, reejsDir) {
  if (url.startsWith("node:")) return url;
  //URLToFile must not be passed `jsr:` specifier. It cannot fetch metadata here as its a sync function.
  if (url.startsWith("npm:"))
    url = url.replace(
      "npm:",
      (process.env.ESM_SERVER || "https://esm.sh") + "/"
    );
  let isJson = false;
  let fileExt = path.extname(url).split("?")[0];
  if (![".json", ".js", ".wasm", ".d.ts"].includes(fileExt)) {
    fileExt = ".js";
  }
  if (
    !url.startsWith("https://") &&
    !url.startsWith("http://") &&
    !url.startsWith("npm:") &&
    !url.startsWith("./") &&
    !url.startsWith("../")
  )
    return url; // must be ?external module from esm.sh
  //support for stackblitz web containers
  if (process.versions.webcontainer && !url.includes("target=node")) {
    //webcontainers emulate nodejs on browser, however u cannot modify the user agent. so we use ?target=node to let esm.sh know that we are using nodejs.
    url = url + (url.includes("?") ? "&" : "?") + "target=node";
  }
  __CACHE_SHASUM[url + "|" + UA] =
    crypto
      .createHash("sha256")
      .update(url + UA)
      .digest("hex")
      .slice(0, 6) + (isJson ? ".json" : ".js");

  let fileString = noFolderPath
    ? "./" +
      crypto
        .createHash("sha256")
        .update(url + UA)
        .digest("hex")
        .slice(0, 6) +
      fileExt
    : path.join(
        reejsDir == true ? path.join(processCwd, ".reejs") : _reejsDir,
        "cache",
        crypto
          .createHash("sha256")
          .update(url + UA)
          .digest("hex")
          .slice(0, 6) + fileExt
      );
  return fileString;
};

let followRedirect = async function (url, forBrowser = false) {
  if (url.startsWith("node:")) return url;
  if (url.startsWith("npm:")) {
    return (
      await fetch(
        (process.env.ESM_SERVER || "https://esm.sh/") +
          "/" +
          url.replace("npm:", "") +
          "?bundle",
        {
          headers: {
            "User-Agent": forBrowser
              ? `Mozilla/5.0 (reejs/${pkgJson.version})`
              : UA,
          },
        }
      )
    ).url;
  }
  if (!url.startsWith("https://") && !url.startsWith("http://")) {
    return "node:" + url;
  }
  try {
    let finalURL = url;
    let res = await fetch(url, {
      method: "HEAD",
      headers: { "User-Agent": UA },
    }).catch(async () => {
      let response;
      while (true) {
        try {
          response = await fetch(url, {
            method: "GET",
            headers: { "User-Agent": UA },
          });
          break;
        } catch (error) {
          //console.trace("Failed to fetch:", url);
        }
      }
      return response;
    });
    finalURL = res.url;
    return finalURL;
  } catch (e) {
    console.log(e);
  }
};

function waitUntilArrayDoesntHaveValue(element) {
  return new Promise(resolve => {
    let interval;
    let fn = () => {
      if (!CURRENT_DOWNLOADING.includes(element)) {
        clearInterval(interval);
        resolve();
      }
    };
    fn();
    interval = setInterval(fn, 100);
  });
}

globalThis.CURRENT_DOWNLOADING = [];
globalThis.NOTIFIED_UPDATE_URL = [];
globalThis.MODULES_SENT_TO_DOWNLOAD = [];
let lexer, parser;

if (!fs.existsSync(path.join(_reejsDir, "failsafe", "spinnies.js"))) {
  let spinniesCode = await fetchUrl(
    `${process.env.ESM_SERVER || "https://esm.sh"}/v128/spinnies@0.5.1/${
      globalThis?.Deno ? "denonext" : "node"
    }/spinnies.bundle.mjs`
  );
  fs.writeFileSync(
    path.join(_reejsDir, "failsafe", "spinnies.js"),
    spinniesCode
  );
}

const spinners = new (DynamicImport(
  await import("file://" + path.join(_reejsDir, "failsafe", "spinnies.js"))
))();

let dl = async function (
  url,
  cli = false,
  remove = false,
  forBrowser = false,
  ua = UA,
  isChild = false
) {
  if (
    (globalThis.process?.env?.REEJS_UA ||
      globalThis.Deno?.env?.get("REEJS_UA")) &&
    (globalThis.process?.env?.REEJS_UA ||
      globalThis.Deno?.env?.get("REEJS_UA")) != UA
  ) {
    UA =
      globalThis.process?.env?.REEJS_UA ||
      globalThis.Deno?.env?.get("REEJS_UA");
    ua = UA;
  }
  if (url.includes("@reejs/cache")) throw new Error(url);
  let originalUrl = url;
  if (globalThis?.process?.env?.USED_BY_CLI_APP) cli = false; //installs deps to reejs dir instead of current dir.
  if (url == "https://esm.sh") url = "https://esm.sh/"; //fix for esm.sh
  if (process.env.ESM_SERVER && url.startsWith("https://esm.sh/")) {
    url = url.replace("https://esm.sh", process.env.ESM_SERVER);
  }
  let start = Date.now();
  let wasmFiles = [];
  if (ua && ua != "Set user agent to download the package") UA = ua;
  //do not mutate the original reejsDir, as it might effect other modules.
  let reejsDir = _reejsDir;
  if (cli) reejsDir = path.join(processCwd, ".reejs");

  if (!fs.existsSync(path.join(reejsDir, "cache"))) {
    fs.mkdirSync(path.join(reejsDir, "cache"), { recursive: true });
    fs.writeFileSync(
      path.join(reejsDir, "cache", "package.json"),
      JSON.stringify({ type: "module" })
    );
  }

  if (url.startsWith("node:")) return url;
  if (url.startsWith("jsr:")) {
    url = await getJSR_URL(url);
  }
  if (url.startsWith("npm:")) {
    url =
      (process.env.ESM_SERVER || "https://esm.sh") +
      "/" +
      url.replace("npm:", "") +
      "?bundle";
  }
  if (
    !url.startsWith("https://") &&
    !url.startsWith("http://") &&
    !url.startsWith("/")
  ) {
    return url; //must be an ?external module feature of esm.sh
  }
  if (url.startsWith("/")) {
    throw new Error("Absolute paths are not supported.");
  }
  //support for stackblitz web containers
  if (process.versions.webcontainer) {
    //webcontainers emulate nodejs on browser, however u cannot modify the user agent. so we use ?target=node to let esm.sh know that we are using nodejs.
    url = url + (url.includes("?") ? "&" : "?") + "target=node";
  }
  if (!remove && fs.existsSync(URLToFile(url, null, cli))) {
    return URLToFile(url, null, cli);
  }
  if ((isChild && process.env.DEBUG) || !isChild)
    spinners.add(originalUrl, {
      text: styleit(`${isChild ? "├─  " : ""}🔍 %c${url}`, "", "color: blue"),
    });
  let res = await followRedirect(url, forBrowser); //returns url
  if (fs.existsSync(URLToFile(res, null, cli))) {
    if (res != url && !NOTIFIED_UPDATE_URL.some(u => u == url)) {
      spinners.succeed(originalUrl, {
        text: styleit(
          `${
            isChild ? "├─  " : ""
          }🪄 %c Please use specific version for %c${url} %cto access %c${res} %cfaster without pinging for latest version`,
          "",
          "color: yellow",
          "color: blue",
          "color: yellow",
          "color: blue",
          "color: yellow"
        ),
      });
      NOTIFIED_UPDATE_URL.push(url);
    }
    return URLToFile(res, null, cli);
  }
  if (!lexer) {
    if (env == "bun") {
      let transpiler = new Bun.Transpiler();
      lexer = {
        parse: code => {
          let _imports = transpiler.scanImports(code);
          _imports = _imports.map(e => e.path);
          return _imports.filter(e => {
            return !e.startsWith("node:");
          });
        },
      };
    } else {
      let p = await import("./lexer.js");
      await p.init;
      lexer = {
        parse: code => {
          let arr = p.parse(code);
          arr = arr[0].map(e => {
            return e.n;
          });
          return Array.from(new Set(arr))
            .filter(i => !!i)
            .filter(i => {
              return !i.startsWith("node:");
            });
        },
      };
    }
  }
  let finalURL = res;
  if ((isChild && process.env.DEBUG) || !isChild)
    spinners.update(originalUrl, {
      text: styleit(
        `${isChild ? "├─  " : ""}🚚 %c${finalURL}`,
        "",
        "color: blue"
      ),
    });
  //set timeout for fetch for 30 secs, after which throw error
  let timeout = setTimeout(async () => {
    throw new Error(
      `Failed to download ${finalURL}\nUser Agent: ${
        forBrowser ? `Mozilla/5.0 (reejs/${pkgJson.version})` : UA
      }\n${await res.text()}`
    );
  }, 30000);
  res = await fetch(finalURL, {
    headers: {
      "User-Agent": forBrowser ? `Mozilla/5.0 (reejs/${pkgJson.version})` : UA,
    },
  }).catch(async () => {
    let response;
    while (true) {
      try {
        response = await fetch(finalURL, {
          method: "GET",
          headers: { "User-Agent": UA },
        });
        break;
      } catch (error) {
        //console.trace("URL Failed to fetch:", finalURL);
      }
    }
    return response;
  });
  clearTimeout(timeout);
  let statusCode = res.statusCode || res.status;
  if ([400, 404, 500, 502, 503, 504].includes(statusCode)) {
    throw new Error(
      `Failed to download ${finalURL} with status code ${statusCode}\n${await res.text()}`
    );
  }
  let contentType = res.headers.get("content-type");
  let types = res.headers.get("x-typescript-types");
  await waitUntilArrayDoesntHaveValue(finalURL);
  if (CURRENT_DOWNLOADING.includes(finalURL)) {
    //idk why this happens, but it does fix the issue regarding infinite loop of downloading modules...
    //return URLToFile(finalURL);
    //wait until the module is downloaded and removed from the array, then return the file.
    await waitUntilArrayDoesntHaveValue(finalURL);
    return URLToFile(finalURL, null, cli);
  }
  if (!remove && fs.existsSync(URLToFile(finalURL, null, cli))) {
    return URLToFile(finalURL, null, cli);
  }
  CURRENT_DOWNLOADING.push(finalURL);
  MODULES_SENT_TO_DOWNLOAD.push(finalURL);
  let code = await res.text();
  if (code == "Module not found") {
    throw new Error(
      `Failed to download ${finalURL} with status code ${statusCode}`
    );
  }
  let tries = 0;
  while (code == "" && finalURL == url) {
    code = await (
      await fetch(finalURL, {
        headers: {
          "User-Agent": forBrowser
            ? `Mozilla/5.0 (reejs/${pkgJson.version})`
            : UA,
        },
      })
    ).text();
    tries++;
    if (code == "" && tries > 10)
      console.log(tries + " try: Retry due to Empty code for " + finalURL);
    //sleep for x * 100ms
    await new Promise(resolve => setTimeout(resolve, tries * 100));
  }
  let oldCode = code;
  let ext = path.extname(finalURL.split("?")[0]).slice(1);
  if (
    ext == "ts" ||
    contentType.includes("typescript") ||
    ext == "tsx" ||
    ext == "jsx"
  ) {
    if ((isChild && process.env.DEBUG) || !isChild)
      spinners.update(originalUrl, {
        text: styleit(
          `${isChild ? "├─  " : ""}🔮 %c${finalURL}`,
          "",
          "color: blue"
        ),
      });
    if (!parser) {
      parser = await Import("npm:v132/sucrase@3.32.0?bundle", {
        internalDir: true,
      });
    }
    let transforms =
      ext === "jsx"
        ? ["jsx"]
        : ext === "ts"
          ? ["typescript"]
          : ext === "tsx"
            ? ["typescript", "jsx"]
            : [];
    code = parser.transform(code, {
      transforms,
      production: true,
    }).code;
    if (code == "Invalid Body") throw new Error("Invalid Body in " + finalURL);
  }
  if (
    (code.includes("React.createElement") ||
      code.includes("React.createFragment") ||
      code.includes("React.Component")) &&
    !code.includes("import React from") &&
    !code.includes("import * as React from") &&
    !code.includes("import*as React from") &&
    !code.includes("import React, {") &&
    !code.includes("import React,{") &&
    !new URL(originalUrl).pathname.startsWith("/stable/react@") //fix for infinite loop of downloading react from esm.sh
  ) {
    code = `import React from "${react}";\n` + code;
  }
  if (types) {
    if (!fs.existsSync(URLToFile(types, null, cli))) {
      if ((isChild && process.env.DEBUG) || !isChild)
        spinners.update(originalUrl, {
          text: styleit(
            `${isChild ? "├─  " : ""}🤖 %c${finalURL}`,
            "",
            "color: blue"
          ),
        });
      let typecode = await (
        await fetch(types, {
          headers: {
            "User-Agent": forBrowser
              ? `Mozilla/5.0 (reejs/${pkgJson.version})`
              : UA,
          },
        }).catch(async () => {
          let response;
          while (true) {
            try {
              response = await fetch(url, {
                method: "GET",
                headers: { "User-Agent": UA },
              });
              break;
            } catch (error) {
              //console.trace("Failed to fetch:", url);
            }
          }
          return response;
        })
      ).text();
      //save the types to a file
      fs.writeFileSync(
        URLToFile(types, null, cli).replace(".js", ".d.ts"),
        typecode
      );
      code =
        `/// <reference path="${URLToFile(types, true).replace(
          ".js",
          ".d.ts"
        )}"/>\n` + code;
    }
  }

  let packs = [];
  try {
    packs = lexer.parse(code);
  } catch (e) {
    console.log(code);
    console.log(
      "%c[ERROR] %cSkipping %c" + finalURL + "%c because of %cParse Error",
      "color:red",
      "color:blue",
      "color:yellow",
      "color:blue",
      "color:red"
    );
    console.log(e);
    code = oldCode;
    packs = [];
  }

  // map packs , find the npm: and and run followRedirect on it and return the
  // url
  if ((isChild && process.env.DEBUG) || !isChild)
    spinners.update(originalUrl, {
      text: styleit(
        `${isChild ? "├─  " : ""}👪️ %c${finalURL}`,
        "",
        "color: blue"
      ),
    });
  let files = await Promise.all(
    packs.map(async e => {
      //if(e.endsWith(".json.js")) e = e.replace(".json.js",".json");
      //if(e.endsWith("node/package.json")) e = e.replace("node/package.json","package.json");
      if (e.startsWith("npm:")) {
        return await followRedirect(
          (process.env.ESM_SERVER || "https://esm.sh") +
            "/" +
            e.replace("npm:", "") +
            "?bundle",
          forBrowser
        );
      } else if (e.startsWith("/")) {
        let eurl = new URL(finalURL);
        return eurl.origin + e;
      } else if (e.startsWith("./") || e.startsWith("../")) {
        let eurl = new URL(finalURL);
        return eurl.origin + path.join(path.dirname(eurl.pathname), e);
      }
      return e;
    })
  );
  files = files.map(e => {
    return URLToFile(e, true);
  });
  await Promise.all(
    packs.map(async (p, i) => {
      if (files[i].startsWith("jsr:"))
        files[i] = URLToFile(await getJSR_URL(files[i]), true);
      code = code.replaceAll(p, files[i]);
      let dlUrl;
      if (p.startsWith("/")) {
        let eurl = new URL(finalURL);
        dlUrl = eurl.protocol + "//" + path.join(eurl.host, p);
      } else if (p.startsWith("./") || p.startsWith("../")) {
        let eurl = new URL(finalURL);
        dlUrl =
          eurl.protocol +
          "//" +
          eurl.hostname +
          path.join(path.dirname(eurl.pathname), p);
        code = code.replaceAll(p, URLToFile(dlUrl, true));
      }
      //if(p.endsWith(".json.js")) p = p.replace(".json.js",".json");
      //if(p.endsWith("node/package.json")) p = p.replace("node/package.json","package.json");
      return await dl(dlUrl || p, cli, remove, forBrowser, ua, finalURL);
    })
  );

  if (!remove) {
    // save file
    let dir = path.dirname(URLToFile(finalURL, null, cli));
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (code == "") {
      console.log(
        "%c[WARN] %cSkipping %c" + finalURL + "%c because of %cEmpty Code",
        "color:red",
        "color:blue",
        "color:yellow",
        "color:blue",
        "color:red"
      );
      return URLToFile(finalURL, null, cli); // this crashes but it wont save the file, so it can be fetched next time
    }
    if (code.includes(".wasm")) {
      if ((isChild && process.env.DEBUG) || !isChild)
        spinners.update(originalUrl, {
          text: styleit(
            `${isChild ? "├─  " : ""}🧩 %c${finalURL}`,
            "",
            "color: blue"
          ),
        });
      code = code.replaceAll(
        /(__dirname\s*(,|\+)\s*)?(("|'|`)[^("|'|`)]+\.wasm("|'|`))/g,
        e => {
          // e is the match, like __dirname+"./file.wasm"
          let ematch = JSON.stringify(e)
            .replace("__dirname", "")
            .replaceAll(" ", "")
            .replaceAll("+", "")
            .replaceAll(",", "")
            .replaceAll('"', "")
            .replaceAll("'", "")
            .replaceAll("`", "");
          let eurl = new URL(finalURL);
          let wasmUrl =
            eurl.protocol +
            "//" +
            eurl.hostname +
            path.join(path.dirname(eurl.pathname), ematch).replaceAll("\\", "");
          wasmFiles.push(wasmUrl);
          return `new URL("${URLToFile(
            wasmUrl,
            true
          )}",import.meta.url).href.slice(7)`;
        }
      );
    }
    await Promise.all(
      wasmFiles.map(async e => {
        let f = await (await fetch(e)).arrayBuffer();
        fs.writeFileSync(URLToFile(e, null, cli), Buffer.from(f));
      })
    );
    if ((isChild && process.env.DEBUG) || !isChild)
      spinners.update(originalUrl, {
        text: styleit(
          `${isChild ? "├─  " : ""}📝 %c${finalURL}`,
          "",
          "color: blue"
        ),
      });
    fs.writeFileSync(URLToFile(finalURL, null, cli), code);
  }
  if ((isChild && process.env.DEBUG) || !isChild)
    spinners.update(originalUrl, {
      text: styleit(
        `${isChild ? "├─  " : ""}💾 %c${finalURL}`,
        "",
        "color: blue"
      ),
    });
  if (remove && fs.existsSync(URLToFile(finalURL, null, cli))) {
    if ((isChild && process.env.DEBUG) || !isChild)
      spinners.update(originalUrl, {
        text: styleit(
          `${isChild ? "├─  " : ""}🗑️ %c${finalURL}`,
          "",
          "color: blue"
        ),
      });
    fs.unlinkSync(URLToFile(finalURL, null, cli));
  }
  CURRENT_DOWNLOADING = CURRENT_DOWNLOADING.filter(e => e != finalURL);
  if ((isChild && process.env.DEBUG) || !isChild)
    spinners.update(originalUrl, {
      text: styleit(
        `${isChild ? "├─  " : ""}%c${finalURL} %cin %c${
          (Date.now() - start) / 1000
        }s`,
        "",
        "color: blue",
        "color: gray",
        "color: green"
      ),
    });
  if (!isChild || (isChild && process.env.DEBUG)) spinners.succeed(originalUrl);
  return URLToFile(finalURL, null, cli);
};

export default dl;
export { URLToFile, followRedirect };

if (globalThis?.process) {
  process.on("beforeExit", save);
  process.on("exit", save);
  process.on("uncaughtException", save);
  process.on("SIGINT", save);
  process.on("SIGTERM", save);
  process.on("SIGHUP", save);
} else {
  //deno
  globalThis?.window?.addEventListener("unload", save);
  //deno can't catch uncaught exceptions
}
