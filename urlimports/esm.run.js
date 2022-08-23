import fs from "fs";
import path from "path";
import https from "https";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename).split("/").slice(0, -1).join("/");
const originalEmit = process.emit;
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
    process.env.REEJS_CUSTOM_DIR = __dirname.split("/").slice(0, -1).join("/");
}
let dir = fs.existsSync(process.env.REEJS_CUSTOM_DIR) ? process.env.REEJS_CUSTOM_DIR : `${home}/.reejs`;

if(globalThis.fetch){
    globalThis._fetch = globalThis.fetch;
}
if (!globalThis.fetch) {
    globalThis._fetch = await import(`${dir}/polyfill/fetch.js`);
    globalThis._fetch = globalThis._fetch.default;
}

export default async function dl(url, p) {
    if (url.startsWith("https://cdn.jsdelivr.net/npm") && url.endsWith("+esm")) {
        url = url.replace("https://cdn.jsdelivr.net/npm/", "https://esm.run/").replace("/+esm", "");
    }
    if (!url.startsWith("https://esm.run/")) {
        throw new Error("Only esm.sh urls are supported!\n" + url);
    }
    if (url.endsWith("/")) url = url.slice(0, -1);
    url = (url.replace("https://esm.run/", "https://cdn.jsdelivr.net/npm/") + "/+esm").replace("/npm//npm/", "/npm/");
    let originalUrl = url;
    url = url.split("?")[0];
    let name = url.replace("https://cdn.jsdelivr.net/npm/", "").split("@")[0];
    let version = url.startsWith("@") ? url.replace("@", "").split("@")[1] : url.split("@")[1];
    let modPath;
    if (version?.includes("/")) modPath = version.split("/").slice(1).join("/");
    if (modPath) version = version.split("/")[0];
    if (fs.existsSync(__dirname + `/storage/local/esm.run/${name}@${version}${modPath ? `/${modPath}.js` : "/index.js"}`)) return __dirname + `/storage/local/esm.run/${name}@${version}${modPath ? `/${modPath}.js` : "/index.js"}`;
    console.log(`[DOWNLOAD] ⏬ ${originalUrl}${p ? ` ↩️  ${p}` : ""}`);
    let code = await _fetch(originalUrl).then(res => res.text());
    code = code.replaceAll("https://cdn.jsdelivr.net/npm/", "/");
    //find relative urls in the code that starts with /v91 or /v89
    let relativeUrls = code.match(/\/npm[A-Za-z_.0-9\/@-]+\+esm/g);
    relativeUrls = Array.from(new Set(relativeUrls));
    if (relativeUrls) {
        await Promise.all(relativeUrls.map(async (url) => {
            let _rawUrl = url;
            let _originalUrl = "https://cdn.jsdelivr.net/npm/" + url;
            url = _originalUrl;
            url = url.split("?")[0];
            let _name = url.replace("https://cdn.jsdelivr.net/npm/", "").split("@")[0];
            let _version = url.startsWith("@") ? url.replace("@", "").split("@")[1] : url.split("@")[1];
            let _modPath;
            if (_version?.includes("/")) _modPath = _version.split("/").slice(1).join("/");
            if (_modPath) _version = _version.split("/")[0];
            if (!_modPath?.endsWith(".js") && modPath != undefined) {
                _modPath = _modPath + ".js";
            }
            code = code.replace(_rawUrl, _rawUrl.replace("/npm", __dirname + "/storage/local/esm.run").replace("+esm", "+esm.js"));
            await dl(url, name);
        }));
    }
    if (!fs.existsSync(__dirname + `/storage/local/esm.run/${name}@${version}`)) {
        fs.mkdirSync(__dirname + `/storage/local/esm.run/${name}@${version}`, { recursive: true });
    }
    if (modPath) {
        let modDir = modPath.split("/").slice(0, -1).join("/");
        if (!fs.existsSync(__dirname + `/storage/local/esm.run/${name}@${version}/${modDir}`)) {
            fs.mkdirSync(__dirname + `/storage/local/esm.run/${name}@${version}/${modDir}`, { recursive: true });
        }
    }
    if (!modPath?.endsWith(".js") && modPath != undefined) {
        modPath = modPath + ".js";
    }
    code = code.replaceAll(`${__dirname}/storage/local${__dirname}`, __dirname);
    fs.writeFileSync(__dirname + `/storage/local/esm.run/${name}@${version}${modPath ? `/${modPath}` : "/index.js"}`, code, "utf8");
    return __dirname + `/storage/local/esm.run/${name}@${version}${modPath ? `/${modPath}` : "/index.js"}`;
}