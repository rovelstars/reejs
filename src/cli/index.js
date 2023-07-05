#!/usr/bin/env -S node
globalThis.USING_REEJS_CLI = true; //a seperator for reejs cli and @reejs/imports
import env, {dirname} from "@reejs/imports/env.js";
import NativeImport from "@reejs/imports/nativeImport.js";
import "@reejs/utils/log.js";
import {Import} from "@reejs/imports/URLImport.js";

let modulesLoadTimeout = setTimeout(() => {
    console.log("%c[REEJS] %cStarting for the first time, downloading dependencies...", "color: #db2777", "color: #ffffff");
}, 1000);

import DynamicImport from "@reejs/imports/dynamicImport.js";
let sade = await Import("sade@1.8.1", {internalDir: true});
let pkgJson = (DynamicImport(await import("./version.js"))).reejs;
// recursively import all files from cmds folder
import addCmd from "./cmds/add.js";
import doctorCmd from "./cmds/doctor.js";
import initCmd from "./cmds/init.js";
import npmsyncCmd from "./cmds/npmsync.js";
import packitCmd from "./cmds/packit.js";
import removeCmd from "./cmds/remove.js";
import replCmd from "./cmds/repl.js";
import xCmd from "./cmds/x.js";

let prog = sade("reejs");
prog.version(pkgJson.version);
addCmd(prog);
doctorCmd(prog);
initCmd(prog);
npmsyncCmd(prog);
packitCmd(prog);
removeCmd(prog);
replCmd(prog);
xCmd(prog);

let processArgv = globalThis?.process?.argv || ["deno", "reejs",...globalThis?.Deno?.args];
prog.parse(processArgv);
clearTimeout(modulesLoadTimeout);
