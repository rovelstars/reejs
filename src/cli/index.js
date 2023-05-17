#!/usr/bin/env node
import env, {dirname} from "../imports/env.js";
import NativeImport from "../imports/nativeImport.js";
import "@reejs/utils/log.js";
import {Import} from "../imports/URLImport.js";
await Promise.all(
    [ Import("sade@1.8.1"), Import("ora@6.1.2"), Import("terser@5.16.6"), Import("sucrase@3.29.0") ]);
import DynamicImport from "../imports/dynamicImport.js";
let sade = await Import("sade@1.8.1");
let pkgJson =
    DynamicImport(await import("../../package.json", {assert: {type: "json"}}));
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