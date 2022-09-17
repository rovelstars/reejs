import fs from "./fs.js";
import path from "./path.js";
import "../polyfill/process.js";
import { fileURLToPath } from "./url.js";
import { homedir, platform } from "./os.js";
import { get } from "./https.js";
const __filename = fileURLToPath(import.meta.url);
globalThis.__dirname = path.dirname(__filename).split("/").slice(0, -1).join("/");
const originalEmit = process?.emit;
let home = homedir();
let os = platform();
let homewin;
if (os == "win32") {
    homewin = home;
    home = home.replace(/\\/g, "/");
}
process.emit = function (name, data, ...args) {
    if (
        name === `warning` &&
        typeof data === `object` &&
        data.name === `ExperimentalWarning`
    )
        return false;

    return originalEmit.apply(process, arguments);
};
if (!process.env.REEJS_CUSTOM_DIR) {
    process.env.REEJS_CUSTOM_DIR = __dirname;
}
let dir = fs.existsSync(process.env.REEJS_CUSTOM_DIR) ? process.env.REEJS_CUSTOM_DIR : `${home}/.reejs`;
if (globalThis.fetch) {
    globalThis._fetch = globalThis.fetch;
}
if (!globalThis.fetch) {
    globalThis._fetch = await import("./fetch.js");
    globalThis._fetch = globalThis._fetch.default;
}

if (!globalThis.lexer) {
    globalThis.lexer = await import("./lexer.js");
    await lexer.init;
}
let parser;
export default async function dl(url, local, _domain) {
    if (local) {
        __dirname = process.cwd() + "/.cache";
    }
    if (_domain == "esm.run" && url.startsWith("/npm/") && url.endsWith("/+esm")) {
        url = url.slice(4, -5);
    }
    let originalUrl = url.startsWith("/") ? `https://${_domain}${url}` : url;

    if(originalUrl.includes("https://deno.land/x/") && (!globalThis.Deno)) {
        console.log("[REEJS] Installing Polyfills for Deno.land/x");
        globalThis.Deno = await dl("https://esm.sh/@deno/shim-deno?target=node&bundle");
        globalThis.Deno = (await import(globalThis.Deno)).Deno;
}
    let domain = _domain || url.split("/")[2];
    url = url.split("?")[0];
    let mod = url.startsWith("/") ? `https/${url}` : url.replace("https://", "https/");

    if (!mod.endsWith(".js")) {
        mod += ".js";
    }
    if (mod.startsWith("/")) mod = mod.slice(1);
    if (fs.existsSync(`${process.cwd()}/.cache/storage/local/${mod}`)) {
        console.log("exists", mod);
        return `${process.cwd()}/.cache/storage/local/${mod}`;
    }
    if (fs.existsSync(`${dir}/storage/local/${mod}`)) {
        return `${dir}/storage/local/${mod}`;
    }
    if (!originalUrl.startsWith("https://") && !originalUrl.startsWith("http://")) return originalUrl;
    console.log(`[DOWNLOAD] ⏬ ${originalUrl}`);
    let code = await _fetch(originalUrl).then(res => res.text());
    if (originalUrl.split("?")[0].endsWith(".ts")) {
        console.log("[TYPESCRIPT] ⚙️  Converting to JavaScript", originalUrl);
        if (!parser) {
            parser = await dl("https://esm.sh/sucrase?target=node");
            parser = await import(parser);
        }
        code = parser.transform(code, { transforms: ["typescript"], production: true }).code;
    }
    try {
        let [_imports] = await lexer.parse(code)
        _imports = Array.from(new Set(_imports.map(i => i.n))).filter(i=>!!i);
        if (_imports.length > 0) {
            await Promise.all(_imports.map(async i => {
                let copy = i;
                if (i.startsWith(".")) {
                //Urlpath will change from https://esm.sh/hmm/ok to /hmm/
                let urlPath = new URL(i, originalUrl).href;
                copy = urlPath;
            }
            if(i.endsWith(".json.js")) i = i.slice(0, -3);
                let to = await (await dl(copy, local, domain)).replaceAll("//", "/");
                code = code.replaceAll(i, to);
            }));
        }
    }
    catch (e) {
        console.log(e);
        throw new Error(`[DOWNLOAD] ⚠️  Failed to parse ${originalUrl}`);
    };
    if (mod.endsWith(".ts")) mod = mod + ".js";
    if(mod.endsWith(".json.js")) mod = mod.slice(0, -3);
    let modPath = mod.split("/").slice(0, -1).join("/");
    if (!local) {
        if (!fs.existsSync(`${dir}/storage/local/${modPath}`)) {
            fs.mkdirSync(`${dir}/storage/local/${modPath}`, { recursive: true });
        }
        fs.writeFileSync(`${dir}/storage/local/${mod}`, code);

        if (os == "win32") return "file://" + encodeURI(dir) + "/storage/local/" + mod;
        else return `${dir}/storage/local/${mod}`;
    }
    else {
        if (!fs.existsSync(`${process.cwd()}/.cache/storage/local/${modPath}`)) {
            fs.mkdirSync(`${process.cwd()}/.cache/storage/local/${modPath}`, { recursive: true });
        }
        fs.writeFileSync(`${process.cwd()}/.cache/storage/local/${mod}`, code);
        return `${process.cwd()}/.cache/storage/local/${mod}`;
    }
}