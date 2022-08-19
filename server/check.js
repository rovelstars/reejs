let file = process.argv[1].replace(process.cwd() + "/", "");
let extraCmds = process.argv.slice(2);
import { spawn } from "child_process";
import readConfig from "./readConfig.js";
import fs from "fs";
import path from "path";
let cfg = fs.readFileSync(`${process.cwd()}/.reecfg`, "utf8").split("\n");
let mode = readConfig(cfg, "env");
if (mode == "prod") {
    console.log("[STARTING] Reejs booted up as production mode.");
    if(typeof globalThis.Deno != "undefined"){
        console.log("[STARTING] Deno is running.");
    }
    else if (!process.env.NODE_OPTIONS?.includes("--experimental-vm-modules") && !process.env.NODE_OPTIONS?.includes("--experimental-fetch")) {
        spawn("node", [file, ...extraCmds], { stdio: "inherit", env: { ...process.env, NODE_OPTIONS: "--experimental-vm-modules --experimental-fetch" }, detached: false });
    }
}
if (mode == "dev") {
    let child;
    if (!process.env.IS_FORK) {
        console.log("[STARTING] Reejs booted up as development mode.");
        child = (typeof globalThis.Deno != "undefined")?
        spawn("deno", ["run","--unstable","--compat","-A",file,...extraCmds], { stdio: "inherit", env: { ...process.env, IS_FORK: "true" }, detached: false }) :
        spawn("node", [file, ...extraCmds], { stdio: "inherit", env: { ...process.env, IS_FORK: "true", NODE_OPTIONS: "--experimental-vm-modules --experimental-fetch" }, detached: false });
        let reload = () => {
            console.log("Stopping.");
            child?.kill();
            console.log("Starting...");
            child = (typeof globalThis.Deno != "undefined")?
            spawn("deno", ["run", "--unstable","--compat","-A",file,...extraCmds], { stdio: "inherit", env: { ...process.env, IS_FORK: "true" }, detached: false }) :
            spawn("node", [file, ...extraCmds], { stdio: "inherit", env: { ...process.env, IS_FORK: "true", NODE_OPTIONS: "--experimental-vm-modules --experimental-fetch" }, detached: false });
        }
        let wait = false;
            console.log("[RELOADER] Looking for file changes...");
            //get all the folders recursively
            function flatten(lists) {
                return lists.reduce((a, b) => a.concat(b), []);
            }

            function getDirectories(srcpath) {
                return fs.readdirSync(srcpath)
                    .map(file => path.join(srcpath, file))
                    .filter(path => fs.statSync(path).isDirectory());
            }

            function getDirectoriesRecursive(srcpath) {
                return [srcpath, ...flatten(getDirectories(srcpath).map(getDirectoriesRecursive))];
            }
            let dirs = getDirectoriesRecursive(process.cwd()).filter(d => !(d.startsWith(`${process.cwd()}/node_modules`) || d.startsWith(`${process.cwd()}/.git`) || d.startsWith(`${process.cwd()}/assets`) || d.startsWith(`${process.cwd()}/.temp`)));
            //console.log("Looking for file changes!",dirs);
            dirs.forEach(dir => {
                fs.watch(dir, async (event, filename) => {
                    if (event == "change" && !wait) {
                        reload();
                        wait = true;
                        setTimeout(() => { wait = false }, 3000);
                    }
                });
            });
            process.on("SIGINT", () => {
                //kill child
                child?.kill();
                console.log("[INFO] Killed Old server...");
                process.exit(0);
            });
        
    }
}

let f;
if (mode=="prod" && (typeof globalThis.Deno == "undefined")?
(!process.env.NODE_OPTIONS?.includes("--experimental-vm-modules")
&& !process.env.NODE_OPTIONS?.includes("--experimental-fetch")):true) {
    f = false;
}
if (mode=="dev" && !process.env.IS_FORK) {
    f = false;
}
else f = true;
export default f;