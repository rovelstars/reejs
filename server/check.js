import "../polyfill/process.js";
let file = process.argv[1].replace(process.cwd() + "/", "");
let extraCmds = process.argv.slice(2);
if(typeof Deno!=="undefined") extraCmds = ["run","--unstable","-A", "--import-map=./server.import-maps.json"];
import { spawn } from "../utils/child_process.js";
import readConfig from "./readConfig.js";
import fs from "../utils/fs.js";
import path from "../utils/path.js";
let cfg;
try {
    cfg = fs.readFileSync(`${process.cwd()}/.reecfg`, "utf8").split("\n");
} catch (e) {
    throw new Error("No .reecfg file found in current directory.");
}
let mode = readConfig(cfg, "env");
if (mode == "prod") {
}
if (mode == "dev") {
    let child;
    if (!process.env.IS_FORK) {
        console.log("[STARTING] Reejs booted up as development mode.");
        child = (typeof globalThis.Deno != "undefined") ?
            spawn("deno", [...extraCmds, file], { stdio: "inherit", env: { ...process.env, IS_FORK: "true" }, detached: false }) :
            spawn("node", [file, ...extraCmds], { stdio: "inherit", env: { ...process.env, IS_FORK: "true" }, detached: false });
        let reload = () => {
            console.log("Stopping.");
            child?.kill();
            console.log("Starting...");
            child = (typeof globalThis.Deno != "undefined") ?
                spawn("deno", [...extraCmds, file], { stdio: "inherit", env: { ...process.env, IS_FORK: "true" }, detached: false }) :
                spawn("node", [file, ...extraCmds], { stdio: "inherit", env: { ...process.env, IS_FORK: "true" }, detached: false });
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
                .filter(path => { try { return fs.statSync(path).isDirectory() } catch (e) { return false; } });
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

let f = false;
if (mode == "prod") {
    f = true;
}
if (mode == "dev" && process.env.IS_FORK) {
    f = true;
}
export default f;