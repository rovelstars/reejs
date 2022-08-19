window.ree = {
    IS_BROWSER: true,
};
window.Import = async function (url) {
    if (url.startsWith("/src")) {
        url = url.replace("/src", "/__reejs/src?file=/src");
    }
    if (url.startsWith("/__reejs")) url += `&h=${ree.hash}`;
    if (ree.import_maps[url]) {
        url = ree.import_maps[url];
    }
    let mod = await import(url);
    let keys = Object.keys(mod).filter(key => key !== "default");
    try {
        let namespace = {};
        if (Object.keys(mod).includes("default")) {
            namespace = mod.default;
        }
        keys.forEach(key => {
            namespace[key] = mod[key];
        });
        namespace.default = mod.default;
        return namespace;
    } catch (e) {
        return mod;
    }
}
window.$ = function (selector) {
    return document.querySelector(selector);
}
window.$$ = function (selector) {
    return document.querySelectorAll(selector);
}
window.logger = function (msg, lvl = "debug") {
    lvl = lvl.toUpperCase();
    if (ree.opts.env == "dev" && lvl == "DEBUG") {
        console.log("[DEBUG]", msg);
    }
    else if (lvl != "DEBUG" || lvl != "🚦" || lvl != "🥏") {
        console.log(`[${lvl}]`, msg);
    }
}
ree.init = async function (options) {
    ree.opts = options;
    let app = $(`#app`);
    if (!app) {
        logger(`div#app not found! This usually means the initialization is not ran after window load, or it was ran before ${options.app} element was initialized.`, "error");
        return;
    }

    let routerInitiated = false;
    window.addEventListener("mousemove", async () => {
        if (!routerInitiated) {
            routerInitiated = !routerInitiated;
            let { h, render, hydrate } = await Import("preact");
            let htm = await Import('htm');
            let html = htm.bind(h);
            ree.reeact = await Import("preact");
            ree.html = html;
            let page = await Import(`/__reejs/src?file=${ree.pageUrl}`);
            if (ree.needsHydrate) {
                $("#app").innerHTML = "";;
                hydrate(html`<${page} req=${ree.req} />`, $("#app"));
                logger("Rendered Ree.js App", "DEBUG");
            }
            
            let Router = await Import(`/__reejs/assets/router.js?h=${ree.hash}`);
            ree.router = new Router();
            ree.router.startPrefetchLinksInViewport();
        }
    })
    if (ree.opts.env == "dev") {
        logger("Making an Connection to the Dev Server", "RELOADER");
        setInterval(async () => {
            try {
                let newHash = await fetch("/__reejs/hash").then(res => res.text());
                if (newHash != ree.hash) {
                    logger("Reloading Page", "RELOADER");
                    setTimeout(() => {
                        location.reload();
                    }, 2000);
                }
            } catch (e) {
                logger("Error getting hash, is server offline?", "RELOADER");
            }
        }, 5000);
    }
    if (!ree.needsHydrate) logger("Skipped Rendering Ree.js App", "DEBUG");

    if (ree.opts.twind) {
        logger("Starting TWIND", "DEBUG");
        ree.twind = await Import("@twind/cdn");
        ree.twind.setup();
        $("head style#old-twind")?.remove();
        $("html").removeAttribute("hidden");
    }
    if (ree.opts.run != "none") eval(`${ree.opts.run}();//# sourceURL=reejs/afterInit`);
    delete ree.needsHydrate;
    delete ree.opts.run;
    delete ree.opts.twind;
    $$("script").forEach(s => s.remove());
    $$("head link[rel='preload']").forEach(s => s.remove());
}