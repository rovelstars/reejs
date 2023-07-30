import { runtime, reejsDir as dir } from "@reejs/imports/env.js";
import DynamicImport from "@reejs/imports/dynamicImport.js";
let pkg = (DynamicImport(await import("../version.js"))).reejs;
import fs from "node:fs";
import path from "node:path";
let projectCacheJson = {};
let processCwd = globalThis?.process?.cwd?.() || Deno.cwd();
if (fs.existsSync(path.join(processCwd, ".reejs", "cache", "cache.json"))) {
  projectCacheJson = JSON.parse(fs.readFileSync(path.join(processCwd, ".reejs", "cache", "cache.json"), "utf-8"));
}
let reejsDir = dir; // make reejsDir mutable

//on android, process.cwd() is /data/data/com.termux/files/home and since it doesn't include the username, we dont need to redact it
if (!processCwd.startsWith("/data/data/com.termux/files/home")) {
  // replace /home/<user> with /home/[REDACTED]
  processCwd = processCwd.replace(new RegExp("/home/[^/]+"), "/home/[REDACTED]");
  //do the same for reejsDir
  reejsDir = reejsDir.replace(new RegExp("/home/[^/]+"), "/home/[REDACTED]");
}

export let doctorReport = async function () {
  console.log("%c[reejs] %cDoctor", "color: blue", "color: yellow");
  console.log("%c[RUNTIME] %c" + runtime, "color: #7237C1", "color: green");
  console.log("%c[VERSION] %c" + pkg.version, "color: #7237C1", "color: green");
  if (globalThis?.process?.versions?.node) console.log("%c[NODE_VER] %c" + globalThis?.process?.versions?.node, "color: #7237C1", "color: green");
  if (globalThis?.Deno?.version?.deno) console.log("%c[DENO_VER] %c" + globalThis?.Deno?.version?.deno, "color: #7237C1", "color: green");
  if (globalThis?.Bun?.version) console.log("%c[BUN_VER] %c" + globalThis?.Bun?.version, "color: #7237C1", "color: green");
  console.log("%c[REEJS_CACHE] %c" + Object.keys(projectCacheJson).length + " files", "color: #7237C1", "color: green");
  console.log("%c[REEJS_DIR] %c" + reejsDir + " %c, %c" + path.join(processCwd, ".reejs"), "color: #7237C1", "color: green", "color: gray", "color: green");
  console.log("%c[REEJS_DIR_EXISTS] %c" + fs.existsSync(path.join(processCwd, ".reejs")), "color: #7237C1", "color: blue");
  console.log("%c[PWD] %c" + processCwd, "color: #7237C1", "color: green");
}

globalThis.REEJS_doctorReport = doctorReport;

export default async function doctor(prog) {
  prog
    .command("doctor")
    .describe("Provides a diagnosis of reejs")
    .action(doctorReport);
}