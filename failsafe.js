#!/usr/bin/env node
//This is the file that installs the dependencies for the toolkit so toolkit can be used. Exactly follows the specification of cmds/install.js
if(!globalThis.fetch){
  console.log("Fetch not found, polyfilling fetch...");
  let child_process = await import("child_process");
  child_process.spawnSync("npm", ["install", "--save", "node-fetch"], {stdio: "inherit"});
  globalThis.fetch = await import("node-fetch");
  globalThis.fetch = globalThis.fetch.default;
}
import {exec} from "child_process";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

exec(`node ./failsafe/install.js`, {cwd: __dirname},()=>{
  console.log("[INFO] Installed Toolkit Dependencies");
  exec(`node ./failsafe/link.js`, {cwd: __dirname},()=>{
    console.log("[INFO] Linked Toolkit Dependencies");
  });
});