import path from "../utils/path.js";
import { fileURLToPath } from "../utils/url.js";
import "../polyfill/process.js";
import fs from "../utils/fs.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import stdNodeMappings from "./deno/stdNodeMappings.js";
import readConfig from "./readConfig.js";
import { platform } from "../utils/os.js";

if (!process.env.REEJS_CUSTOM_DIR) {
    process.env.REEJS_CUSTOM_DIR = __dirname.split("/").slice(0, -1).join("/");
  }
export let import_map = genImportMap();
function genImportMap() {
    let map = fs.existsSync(`${process.cwd()}/import-maps.json`) ?
    JSON.parse(fs.readFileSync(`${process.cwd()}/import-maps.json`, "utf8")) :
    { imports: {} };
    let servermap = fs.existsSync(`${process.cwd()}/server.import-maps.json`) ?
    JSON.parse(fs.readFileSync(`${process.cwd()}/server.import-maps.json`, "utf8")) :
    { imports: {} };
    //join maps
    for (let i in servermap.imports) {
        map.imports[i] = servermap.imports[i];
    }
    return map;
}

function getImportMap(name) {
    let keys = Object.keys(import_map.imports);
    for (let i = 0; i < keys.length; i++) {
        try{
        if (name.startsWith(keys[i])) {
            name = name.replace(keys[i], import_map.imports[keys[i]]);
        }
    }catch(e){
        throw new Error("Import Map Doesn't Has A Key for " + keys[i]);
    }
    }
    return name;
}

export default async (specifier, opts) => {
    if(specifier.startsWith("src") || specifier.startsWith("/src")){
        //return the js file from storage
        if(!specifier.startsWith("/")) specifier= "/" + specifier;
        let mod = await import(`../storage${specifier.slice(0, specifier.lastIndexOf("."))}.js`,opts);
        try {
            let namespace = {};
            let keys = Object.keys(mod).filter(k => k !== "default");
            if (Object.keys(mod).includes("default")) {
                namespace = mod.default;
            }
            keys.forEach(k => {
                namespace[k] = mod[k];
            });
            namespace.default = mod.default;
            return namespace;
        }
        catch (e) {
            return mod;
        }
    }
    specifier = getImportMap(specifier);
    if (specifier.startsWith("https://") || specifier.startsWith("http://")) {
        let dl = await import("../utils/urlimports.js");
        let savedAt = await dl.default(specifier);
        if(platform=="win32") savedAt = "file:///" + savedAt;
        let mod = await import(savedAt, opts);
        try {
            let namespace = {};
            let keys = Object.keys(mod).filter(k => k !== "default");
            if (Object.keys(mod).includes("default")) {
                namespace = mod.default;
            }
            keys.forEach(k => {
                namespace[k] = mod[k];
            });
            namespace.default = mod.default;
            return namespace;
        }
        catch (e) {
            return mod;
        }
    }
    else {
        let mod = await import(specifier).catch(async e=>{
            if(e.message.startsWith("Cannot find module '")) return await import(process.cwd()+specifier).catch(f=>{throw e});
        });
        try {
            let namespace = {};
            let keys = Object.keys(mod).filter(k => k !== "default");
            if (Object.keys(mod).includes("default")) {
                namespace = mod.default;
            }
            keys.forEach(k => {
                namespace[k] = mod[k];
            });
            namespace.default = mod.default;
            return namespace;
        }
        catch (e) {
            return mod;
        }
    }
}
export async function initDeno(){
    if (typeof Deno == "undefined") {
        let dl = await import("../utils/urlimports.js");
        dl = dl.default;
        globalThis.Deno = (await import(await dl("https://esm.sh/@deno/shim-deno?target=node&bundle"))).Deno;
    }
}