#!/usr/bin/env node
import env, {dirname} from "../imports/env.js";
import NativeImport from "../imports/nativeImport.js";
import "../utils/log.js";
import {Import} from "../imports/URLImport.js";
await Promise.all(
    [ Import("sade@1.8.1"), Import("ora@6.1.2"), Import("terser@5.16.6") ]);
import DynamicImport from "../imports/dynamicImport.js";
let sade = await Import("sade@1.8.1");
let fs = await NativeImport("node:fs");
let path = await NativeImport("node:path");
let pkgJson =
    DynamicImport(await import("../../package.json", {assert: {type: "json"}}));
// recursively import all files from cmds folder
let cmds = fs.readdirSync(path.join(dirname, "./cli/cmds"));
let cmdsObj = {};
let prog = sade("reejs");
prog.version(pkgJson.version);
for (let cmd of cmds) {
  cmdsObj[cmd.split(".")[0]] = DynamicImport(await import(`./cmds/${cmd}`));
}

for (let cmd in cmdsObj) {
  cmdsObj[cmd].default(prog);
}
prog.parse(process.argv);
