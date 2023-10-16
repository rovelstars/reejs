import NativeImport from "./nativeImport.js";
import { reejsDir } from "./env.js";
import version from "@reejs/imports/version.js";
let fs = await NativeImport("node:fs");
let path = await NativeImport("node:path");

export let save = e => {
  //e is Error object
  // save cache sha256
  if (!fs.existsSync(path.join(reejsDir, "cache"))) {
    fs.mkdirSync(path.join(reejsDir, "cache"), { recursive: true });
  }
  let oldCache = {};
  if (fs.existsSync(path.join(reejsDir, "cache", "cache.json"))) {
    try {
      oldCache = fs.readFileSync(
        path.join(reejsDir, "cache", "cache.json"),
        "utf-8"
      );
      oldCache = JSON.parse(oldCache);
    } catch (e) {}
  }
  let totalCache = { ...oldCache, ...globalThis?.__CACHE_SHASUM };
  fs.writeFileSync(
    path.join(reejsDir, "cache", "cache.json"),
    JSON.stringify(totalCache, null, 2)
  );
  let copyE = e;
  if (e instanceof Error) {
    if (
      globalThis?.process?.env?.DEBUG ||
      globalThis?.Deno?.env?.get("DEBUG")
    ) {
      console.log("%cGenerating doctor report...", "color:yellow");
      if (globalThis?.REEJS_doctorReport) globalThis.REEJS_doctorReport();
    }
    console.log(
      "%c INFO %c %cSaving important data...",
      "background-color:blue",
      "",
      "color:yellow"
    );
    if (
      e.stack.includes(".ts") ||
      e.stack.includes(".tsx") ||
      e.stack.includes(".jsx") ||
      e.stack.includes(".js")
    ) {
      if (
        !globalThis?.process?.env?.DEBUG &&
        !globalThis?.Deno?.env?.get("DEBUG")
      )
        console.log(
          "%c TIP %c %cIf the error in your code is in any of the following extensions (.ts, .tsx, .jsx), kindly not focus on the line number as the line numbers depict the compiled code and not the original one. Add `DEBUG=true` to your environment variables to see the original code.",
          "background-color: yellow",
          "",
          "color: white"
        );
    }
    let arr = Object.entries(totalCache);
    let result = arr.map(pair => {
      let newObj = {};
      newObj["file://" + path.join(reejsDir, "cache", pair[1])] = pair[0];
      try {
        newObj["./" + pair[1]] = new URL(pair[0]).pathname;
      } catch (e) {}
      newObj[path.join(reejsDir, "cache", pair[1])] = pair[0];
      return newObj;
    });
    result = Object.assign({}, ...result);
    // change e stack and change the file names to the urls
    let stack = e.stack.split("\n");
    stack = stack.map(e => {
      // replace the file names with the urls
      Object.entries(result).forEach(([key, value]) => {
        e = e.replaceAll(key, value);
      });
      return e;
    });
    e.stack = stack.join("\n");
    console.error(
      globalThis?.process?.env?.DEBUG || globalThis?.Deno?.env?.get("DEBUG")
        ? copyE
        : e
    );
    globalThis?.process?.removeAllListeners("exit"); // dont run save again
    globalThis?.process?.removeAllListeners("beforeExit");
    globalThis?.process?.removeAllListeners("uncaughtException");
    globalThis?.process?.removeAllListeners("SIGINT");
    globalThis?.process?.removeAllListeners("SIGTERM");
    globalThis?.process?.removeAllListeners("SIGHUP");
    globalThis?.window?.removeEventListener("unload", save);
    globalThis?.process?.exit(1);
    globalThis?.Deno?.exit(1);
  }
};
