import { runtime } from "../../imports/env.js";
import DynamicImport from "../../imports/dynamicImport.js";
let pkg =
  DynamicImport(await import("../../../package.json", { assert: { type: "json" } }));
import fs from "node:fs";
import path from "node:path";
let projectCacheJson = {};
if (fs.existsSync(path.join(process.cwd(), ".reejs", "cache", "cache.json"))) {
  projectCacheJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), ".reejs", "cache", "cache.json"), "utf-8"));
}

let processCwd = globalThis?.process?.cwd?.() || Deno.cwd();
// replace /home/<user> with /home/[REDACTED]
processCwd = processCwd.replace(new RegExp("/home/[^/]+"), "/home/[REDACTED]");

export default async function doctor(prog) {
  prog
    .command("doctor")
    .describe("Provides a diagnosis of reejs")
    .action(async function (opts) {
      console.log("%c[reejs] %cDoctor", "color: blue", "color: yellow");
      console.log("%c[RUNTIME] %c" + runtime, "color: #7237C1", "color: green");
      console.log("%c[VERSION] %c" + pkg.version, "color: #7237C1", "color: green");
      if (globalThis?.process?.versions?.node) console.log("%c[NODE_VER] %c" + globalThis?.process?.versions?.node, "color: #7237C1", "color: green");
      if (globalThis?.Deno?.version?.deno) console.log("%c[DENO_VER] %c" + globalThis?.Deno?.version?.deno, "color: #7237C1", "color: green");
      if (globalThis?.Bun?.version) console.log("%c[BUN_VER] %c" + globalThis?.Bun?.version, "color: #7237C1", "color: green");
      console.log("%c[REEJS_CACHE] %c" + Object.keys(projectCacheJson).length + " files", "color: #7237C1", "color: green");
      console.log("%c[REEJS_DIR] %c" + path.join(processCwd, ".reejs"), "color: #7237C1", "color: green");
      console.log("%c[REEJS_DIR_EXISTS] %c" + fs.existsSync(path.join(processCwd, ".reejs")), "color: #7237C1", "color: blue");
      console.log("%c[PWD] %c" + processCwd, "color: #7237C1", "color: green");
    });
}