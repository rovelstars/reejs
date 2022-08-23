import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import stdNodeMappings from "./deno/stdNodeMappings.js";
import readConfig from "./readConfig.js";

let cfg = fs.readFileSync(`${process.cwd()}/.reecfg`, "utf-8").split("\n");
if (!process.env.REEJS_CUSTOM_DIR) {
    process.env.REEJS_CUSTOM_DIR = __dirname.split("/").slice(0, -1).join("/");
  }
export let import_map = fs.existsSync(`${process.cwd()}/import-maps.json`) ?
    JSON.parse(fs.readFileSync(`${process.cwd()}/import-maps.json`, "utf8")) :
    { imports: {} };

function getImportMap(name) {
    let keys = Object.keys(import_map.imports);
    for (let i = 0; i < keys.length; i++) {
        if (name.startsWith(keys[i])) {
            name = name.replace(keys[i], import_map.imports[keys[i]]);
        }
    }
    return name;
}

export default async (specifier) => {
    specifier = getImportMap(specifier);
    if (specifier.startsWith("https://") || specifier.startsWith("http://")) {
        let domain;
        if(specifier.startsWith("https://esm.sh")) domain = "esm.sh";
        else if(specifier.startsWith("https://esm.run")) domain = "esm.run";
        else if(specifier.startsWith("https://cdn.jsdelivr.net") && specifier.endsWith("/+esm")){ 
            specifier = specifier.replace("https://cdn.jsdelivr.net/npm/", "https://esm.run/").replace("/+esm", "");
            domain = "esm.run";
        }
        else if(specifier.startsWith("https://deno.land")) domain = "deno.land";
        let dl = await import(`../urlimports/${domain}.js`);
        let savedAt = await dl.default(specifier);
        let mod = await import(savedAt);
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