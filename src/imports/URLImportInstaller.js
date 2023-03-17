//this file allows you to download files from a URL.
import env from "./env.js";
import NativeImport from "./nativeImport.js";
import { runtime, reejsDir as dir } from "./env.js";
if (runtime == "browser") {
  throw new Error(
    "URLImportInstaller.js is not for edge/browsers. Install them via reejs cli and use them."
  );
}
let reejsDir = dir;
let fs = await NativeImport("node:fs");
let path = await NativeImport("node:path");
let http = await NativeImport("node:http");
let https = await NativeImport("node:https");
import fetch from "./fetch.js";
let crypto = await NativeImport("node:crypto");
import "../utils/log.js";
if (!fs.existsSync(path.join(reejsDir, "cache"))) {
  fs.mkdirSync(path.join(reejsDir, "cache"), { recursive: true });
	fs.writeFileSync(path.join(reejsDir, "cache", "package.json"), JSON.stringify({type:"module"}));
}
globalThis.__CACHE_SHASUM = {};
let URLToFile = function (url, noFolderPath = false) {
  if (url.startsWith("node:")) return url;
  if (!url.startsWith("https://") && !url.startsWith("http://"))
    return "node:" + url;
  __CACHE_SHASUM[url] =
    crypto.createHash("sha256").update(url).digest("hex") + ".js";
  return noFolderPath
    ? "./" + crypto.createHash("sha256").update(url).digest("hex") + ".js"
    : path.join(
        reejsDir,
        "cache",
        crypto.createHash("sha256").update(url).digest("hex") + ".js"
      );
};

let followRedirect = async function (url) {
  if (url.startsWith("node:")) return url;
  if (url.startsWith("npm:")) {
    console.log(url);
    return (
      await fetch(
        "https://esm.sh/" + url.replace("npm:", "") + "?target=node&bundle"
      )
    ).url;
  }
  if (!url.startsWith("https://") && !url.startsWith("http://")) {
    return "node:" + url;
  }
  try {
    let finalURL = url;
    let res = await fetch(url, { method: "HEAD" });
    finalURL = res.url;
    return finalURL;
  } catch (e) {
    console.log(e);
  }
};

let lexer, parser;

let dl = async function (url, cli = false, remove = false) {
  if (cli) {
    reejsDir = path.join(process.cwd(), ".reejs");
    if (!fs.existsSync(path.join(reejsDir, "cache"))) {
      fs.mkdirSync(path.join(reejsDir, "cache"), { recursive: true });
		fs.writeFileSync(path.join(reejsDir, "cache", "package.json"), JSON.stringify({type:"module"}));
    }
  }
  if (url.startsWith("node:")) return url;
  if (url.startsWith("npm:")) {
    url = "https://esm.sh/" + url.replace("npm:", "") + "?target=node&bundle";
  }
  if (!url.startsWith("https://") && !url.startsWith("http://") && !url.startsWith("/")) {
    return "node:" + url;
  }
	if(url.startsWith("/")){
		throw new Error("Absolute paths are not supported.");
	}
  if (!remove && fs.existsSync(URLToFile(url))) {
    return URLToFile(url);
  }
	let res = await followRedirect(url);
	if(fs.existsSync(URLToFile(res))){
		if(res != url){
    console.log(
      "%c[WARNING] %cURLImportInstaller.js: %cPlease use specific version for %c" +
        url +
        " %cto access %c" +
        res +
        " %cfaster without pinging for latest version",
      "color: yellow",
      "color: red",
      "color: white",
      "color: blue",
      "color: white",
      "color: blue",
      "color: white"
    );
		}
    return URLToFile(res);
  }
  if (!lexer) {
    if (env == "bun") {
      console.log(
        "[BUN] Using Native Features that are faster than the polyfills!"
      );
      let transpiler = new Bun.Transpiler();
      lexer = {
        parse: (code) => {
          let _imports = transpiler.scanImports(code);
          _imports = _imports.map((e) => e.path);
          return [_imports].filter((e) => {
            return !e.startsWith("node:");
          });
        },
      };
    } else {
      let p = await import("./lexer.js");
      await p.init;
      lexer = {
        parse: (code) => {
          let arr = p.parse(code);
          arr = arr[0].map((e) => {
            return e.n;
          });
          return Array.from(new Set(arr))
            .filter((i) => !!i)
            .filter((i) => {
              return !i.startsWith("node:");
            });
        },
      };
    }
  }
  res = await fetch(url);
  let finalURL = res.url;
  let code = await res.text();
  if (!remove)
    console.log("%c[DOWNLOAD] %c" + url, "color:blue", "color:yellow");
  if (finalURL.endsWith(".ts")) {
    console.log(
      "%c[TYPESCRIPT] Compiling %c" + finalURL,
      "color:blue",
      "color:yellow; font-weight: bold;"
    );
    if (!parser) {
      parser = await dl("https://esm.sh/sucrase@3.29.0?target=node&bundle");
      parser = await import(parser);
    }
    code = parser.transform(code, {
      transforms: ["typescript"],
      production: true,
    }).code;
  }
  let packs;
  try {
    packs = lexer.parse(code);
  } catch (e) {
    console.log("%c[ERROR] %c" + finalURL, "color:red", "color:blue");
    throw e;
  }
  //map packs , find the npm: and and run followRedirect on it and return the url
  let files = (
    await Promise.all(
      packs.map(async (e) => {
        if (e.startsWith("npm:")) {
          return await followRedirect(
            "https://esm.sh/" + e.replace("npm:", "") + "?target=node&bundle"
          );
        }
		  else if(e.startsWith("/")) {
			  let eurl = new URL(finalURL);
			  return (eurl.origin + e);
		  }
        return e;
      })
    )
  );
		files = files.map((e) => {
    return URLToFile(e, true);
  });

  await Promise.all(
    packs.map(async (p, i) => {
      code = code.replaceAll(p, files[i]);
		if(p.startsWith("/")){
			let eurl = new URL(finalURL);
			p = eurl.origin + p;
		}
      return await dl(p, null, remove);
    })
  );
  if (!remove) {
    fs.writeFile(URLToFile(finalURL), code, (err) => {
      if (err) throw err;
    });
  }
  if (remove && fs.existsSync(URLToFile(finalURL))) {
    console.log("%c[REMOVE] %c" + finalURL, "color:red", "color:blue");
    fs.unlinkSync(URLToFile(finalURL));
  }
  return URLToFile(finalURL);
};

export default dl;
export { URLToFile, followRedirect };
let save = (e) => {
  //save cache sha256
  if (!fs.existsSync(path.join(reejsDir, "cache"))) {
    fs.mkdirSync(path.join(reejsDir, "cache"), { recursive: true });
  }
  let oldCache = {};
  if (fs.existsSync(path.join(reejsDir, "cache", "cache.json"))) {
    oldCache = fs.readFileSync(
      path.join(reejsDir, "cache", "cache.json"),
      "utf-8"
    );
    oldCache = JSON.parse(oldCache);
  }
  let totalCache = { ...oldCache, ...__CACHE_SHASUM };
  fs.writeFileSync(
    path.join(reejsDir, "cache", "cache.json"),
    JSON.stringify(totalCache, null, 2)
  );
	if(e){
		console.log("%c[INFO] %cSaving important data...", "color:blue", "color:yellow");
		if(e.stack.includes(".ts") || e.stack.includes(".tsx") || e.stack.includes(".jsx")){
			console.log("%c[TIP] %cIf the error in your code is in any of the following extensions (.ts, .tsx, .jsx), kindly not focus on the line number as the line numbers depict the compiled code and not the original one.","color: yellow","color: white")
		}
		let arr = Object.entries(totalCache);
		let result = arr.map(pair => {
			let newObj = {};
			newObj["file://"+path.join(reejsDir,"cache", pair[1])] = pair[0];
			return newObj;
		});
		result = Object.assign({}, ...result);

		//change e stack and change the file names to the urls
		let stack = e.stack.split("\n");
		stack = stack.map((e) => {
			//replace the file names with the urls
			Object.entries(result).forEach(([key, value]) => {
				e = e.replaceAll(key, value);
			});
			return e;
		});
		e.stack = stack.join("\n");
 console.error(e);
	process.removeAllListeners("exit"); // dont run save again
	process.exit(1);
}
};
process.on("exit", save);
process.on("uncaughtException", save);