import fs from "./fs.js";
import path from "./path.js";
import "../polyfill/process.js";
import { fileURLToPath } from "./url.js";
import { homedir, platform } from "os";
const __filename = fileURLToPath(import.meta.url);
let __dirname = path.dirname(__filename).split("/").slice(0, -1).join("/");
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
    globalThis._fetch = await import(`../polyfill/fetch.js`);
    globalThis._fetch = globalThis._fetch.default;
}

if (!globalThis.lexer) {
    globalThis.lexer = await import("../utils/lexer.js");
    await lexer.init;
}

export default async function dl(url, p, local, _domain) {
    if (local) {
        __dirname = process.cwd() + "/.cache";
    }
    if(_domain=="esm.run" && url.startsWith("/npm/") && url.endsWith("/+esm")){
        url = url.slice(4, -5);
        }
    let originalUrl = url.startsWith("/") ? `https://${_domain}${url}` : url;
    let domain = _domain || url.split("/")[2];
    url = url.split("?")[0];
    let name = url.replace(`https://${domain}/`, "").split("@")[0];
    let version = url.startsWith("@") ? url.replace("@", "").split("@")[1] : url.split("@")[1];
    let modPath;
    if (version?.includes("/")) modPath = version.split("/").slice(1).join("/");
    if (modPath) version = version.split("/")[0];
    if (fs.existsSync(__dirname + `/storage/local/${domain}/${name}@${version}${modPath ? `/${modPath}` : "/index.js"}`))
        return __dirname + `/storage/local/${domain}/${name}@${version}${modPath ? `/${modPath}` : "/index.js"}`;
    if (fs.existsSync(`${process.cwd()}/.cache/storage/local/${domain}/${name}@${version}${modPath ? `/${modPath}.js` : "/index.js"}`))
        return (`${process.cwd()}/.cache/storage/local/${domain}/${name}@${version}${modPath ? `/${modPath}.js` : "/index.js"}`);
    if (!originalUrl.startsWith("https://") && !originalUrl.startsWith("http://")) return originalUrl;
    console.log(`[DOWNLOAD] ⏬ ${originalUrl}${p ? ` ↩️  ${p}` : ""}`);
    let code = await _fetch(originalUrl).then(res => res.text());
    try {
        let [_imports] = await lexer.parse(code)

        _imports = Array.from(new Set(_imports.map(i => i.n)));
        if (_imports.length > 0) {
            await Promise.all(_imports.map(async i => {
                let to = await dl(i, name, local, domain)
                code = code.replaceAll(i, to);
            }));
        }
    }
    catch (e) {
        console.log(e);
        throw new Error(`[DOWNLOAD] ⚠️  Failed to parse ${originalUrl}`);
    };
    //console.log(code);
    if (!fs.existsSync(__dirname + `/storage/local/${domain}/${name}@${version}`)) {
        fs.mkdirSync(__dirname + `/storage/local/${domain}/${name}@${version}`, { recursive: true });
    }
    if (modPath) {
        let modDir = modPath.split("/").slice(0, -1).join("/");
        if (!fs.existsSync(__dirname + `/storage/local/${domain}/${name}@${version}/${modDir}`)) {
            fs.mkdirSync(__dirname + `/storage/local/${domain}/${name}@${version}/${modDir}`, { recursive: true });
        }
    }
    if (!modPath?.endsWith(".js") && modPath != undefined) {
        modPath = modPath + ".js";
    }
    code = code.replaceAll(`${__dirname}/storage/local/${domain}${__dirname}`, __dirname);
    fs.writeFileSync(__dirname + `/storage/local/${domain}/${name}@${version}${modPath ? `/${modPath}` : "/index.js"}`, code, "utf8");
    return __dirname + `/storage/local/${domain}/${name}@${version}${modPath ? `/${modPath}` : "/index.js"}`
}