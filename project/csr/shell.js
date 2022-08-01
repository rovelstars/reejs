window.ree = {
    IS_BROWSER: true,
};
window.Import = async function (url) {
    if (url.startsWith("/src")) {
        url = url.replace("/src", "/__reejs/src?file=/src");
    }
    if (url.startsWith("/__reejs")) url += `&h=${ree.hash}`;
    if (ree.importMaps[url]) {
        url = ree.importMaps[url];
    }
    let mod = await import(url);
    let keys = Object.keys(mod).filter(key => key !== "default");
    let namespace = {};
    if (Object.keys(mod).includes("default")) {
        namespace = mod.default;
    }
    keys.forEach(key => {
        namespace[key] = mod[key];
    });
    namespace.default = mod.default;
    return namespace;
}
let $ = function (selector) {
    return document.querySelector(selector);
}
let $$ = function (selector) {
    return document.querySelectorAll(selector);
}
window.logger = function (msg, lvl = "debug") {
    lvl = lvl.toUpperCase();
    if (ree.opts.env == "dev" && lvl == "DEBUG") {
        console.log("[DEBUG]", msg);
    }
    else if (lvl != "DEBUG") {
        console.log(`[${lvl}]`, msg);
    }
}
ree.init = async function (options) {
    // options: {app: "",env: "",render:""}
    options.env == "dev" ? "dev" : "prod";
    ree.opts = options;
    let app = $(`#app`);
    if (!app) {
        logger(`div#app not found! This usually means the initialization is not ran after window load, or it was ran before ${options.app} element was initialized.`, "error");
        return;
    }
    if (!options.render) {
        logger(`Render type not specified!`, "error");
        return;
    }
    let { h, render } = await Import("preact");
    let htm = await Import('htm');
    let html = htm.bind(h);
    let page = await Import(`/__reejs/src?file=${ree.pageUrl}`);
    if (ree.needsHydrate) {
        $("#app").innerHTML = "";;
        render(html`<${page} req=${ree.req} />`, $("#app"));
        logger("Rendered Ree.js App", "DEBUG")
    }
    if (ree.opts.env == "dev") {
        logger("Making an Connection to the Dev Server", "RELOADER");
        setInterval(async () => {
            try {
                let newHash = await fetch("/__reejs/hash").then(res => res.text());
                if (newHash != ree.hash) {
                    logger("Reloading Page", "RELOADER");
                    location.reload();
                }
            } catch (e) {
                logger("Error getting hash, is server offline?", "RELOADER");
            }
        }, 5000);
    }
    else logger("Skipped Rendering Ree.js App", "DEBUG");
    //
}