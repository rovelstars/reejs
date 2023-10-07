import DynamicImport from "./dynamicImport.js";
import env, { projectDir } from "./env.js";
import NativeImport from "./nativeImport.js";
import dl from "./URLImportInstaller.js";

if (env == "browser") {
  throw new Error(
    "You cannot consume URLImport.js in the browser/edge. Use import maps and link url deps to npm package names.",
  );
}
let fs = await NativeImport("node:fs");
let path = await NativeImport("node:path");

export default async function URLImport(url, internalDir = false) {
  url = new URL(url);
  if (url.protocol == "node:") {
    return await NativeImport(url.pathname);
  }
  if (url.protocol == "http:" || url.protocol == "https:") {
    let file = await dl(url.href, !internalDir);
    if (!fs.existsSync(file)) {
      throw new Error(`File ${file} does not exist`);
    }
    return DynamicImport(await import("file://" + file));
  } else {
    throw new Error("Invalid URL " + url);
  }
}

export async function Import(
  name,
  opts = {
    internalDir: false,
  },
) {
  if (name.startsWith("node:")) {
    return await NativeImport(name);
  } else if (name.startsWith("http:") || name.startsWith("https:")) {
    return await URLImport(name, opts.internalDir);
  } else if (name.startsWith("npm:")) {
    return await URLImport(
      `${process.env.ESM_SERVER || "https://esm.sh"}/${name.slice(4)}`,
      opts.internalDir,
    );
  } else {
    let url = `${process.env.ESM_SERVER || "https://esm.sh"}/${name}`;
    return await URLImport(url, opts.internalDir);
  }
}
