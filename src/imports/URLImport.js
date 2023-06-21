import DynamicImport from "./dynamicImport.js";
import env, { projectDir } from "./env.js";
import NativeImport from "./nativeImport.js";
import dl from "./URLImportInstaller.js";

if (env == "browser") {
  throw new Error(
    "You cannot consume URLImport.js in the browser/edge. Use import maps and link url deps to npm package names.");
}
let fs = await NativeImport("node:fs");
let path = await NativeImport("node:path");

export default async function URLImport(url) {
  url = new URL(url);
  if (url.protocol == "node:") {
    return await NativeImport(url.pathname);
  }
  if (url.protocol == "http:" || url.protocol == "https:") {
    return DynamicImport(await import(await dl(url.href)));
  }
  throw new Error("Invalid URL");
}

export async function Import(name, opts = {
  host: "esm.sh",
  bundle: true,
}) {
  if (name.startsWith("node:")) {
    return await NativeImport(name);
  }
  else if (name.startsWith("http:") || name.startsWith("https:")) {
    return await URLImport(name);
  }
  else if (name.startsWith("npm:")) {
    return await URLImport(`https://esm.sh/${name.slice(4)}${opts.bundle ? "?bundle" : ""}`);
  }
  else {
    let url =
      new URL(`https://${opts.host}/${name}${opts.bundle ? "?bundle" : ""}`);
    return await URLImport(url);
  }
}
