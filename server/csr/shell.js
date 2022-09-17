window.ree = {
    IS_BROWSER: true,
};
if(!window.Import) console.log("Adding Import");
if(!window.Import) window.Import = async function (url) {
    window.__USE_STATIC = (ree.opts.mode == "static");
    if(url.startsWith("src/")) url= "/"+url;
    if (url.startsWith("/src") && !__USE_STATIC) {
        url = url.replace("/src", "/__reejs/src?file=/src");
    }
    if (url.startsWith("/__reejs")) url += `&h=${ree.hash}`;
    if (ree.import_maps[url]) {
        url = ree.import_maps[url];
    }
    if (__USE_STATIC) {
        url = url.replace(`?h=${ree.hash}`, "").replace(`&h=${ree.hash}`, "");
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
    else if (lvl != "DEBUG") {
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

    let Initiated = false;
    let loader =  async () => {
        if (!Initiated) {
            Initiated = !Initiated;
            let Router = await Import(`/__reejs/assets/router.js${(ree.opts.mode == "static") ? "" : `?h=${ree.hash}`}`);
            ree.router = new Router();
            ree.router.startPrefetchLinksInViewport();
            let { h, render, hydrate } = await Import("react");
            let htm = await Import('htm');
            let html = htm.bind(h);
            ree.reeact = await Import("react");
            window.React = ree.reeact;
            ree.html = html;
            let foundRoute;
            if (!ree.pageUrl) foundRoute = await ree.router.lookup(location.pathname);
            if (!ree.pageUrl && !foundRoute) foundRoute = await ree.router.lookup(location.pathname.slice(0, -1));
            if(!ree.pageUrl) ree.pageUrl = foundRoute.payload;
            let page = await Import(ree.pageUrl || foundRoute.payload);
            if((ree.opts.mode=="csr" || ree.opts.mode=="static") && page?.config?.body) {
                globalThis.vbody = document.createElement("body");
                render(html`<${page.config.body} />`, vbody);
                ree.vbody = vbody;
                document.body.outerHTML = vbody.outerHTML;
                [...$$("head")].filter(e=>e.outerHTML=="<head></head>").forEach(e=>e.remove());
            }
            if((ree.opts.mode=="csr" || ree.opts.mode=="static") && page?.head){
                let newHead = document.createElement("head");
                let currentHead = document.head;
                render(html`<${page.head} />`, newHead);
                const old = Array.from(currentHead.children);
                const next = Array.from(newHead.children);
                const freshNodes = next.filter(
                  (newNode) => !old.find((oldNode) => oldNode.isEqualNode(newNode))
                );
                freshNodes.forEach((node) => {
                    //if the node with same element name exists, replace it
                    if(currentHead.querySelector(node.tagName)){
                        currentHead.querySelector(node.tagName).replaceWith(node);
                    }
                    else{
                  currentHead.appendChild(node);
                    }
                });
            }
            if (ree.needsHydrate || ree.opts.mode == "csr" || ree.opts.mode == "static") {
                $("#app").innerHTML = "";
                render(html`<${page} req=${ree.req} />`, $("#app"));
                logger("Rendered Ree.js App", "DEBUG");
                $$("a").forEach(a => { a.addEventListener('click', (e) => ree.router.onClick(e)) });
                window.addEventListener('popstate', (e) => ree.router.onPop(e));
                if(page?.config?.runAfterInit) page?.config?.runAfterInit();
            }
        }
    }
    window.addEventListener((ree.opts.mode == "ssr" && (window.innerWidth>1000)) ? "mousemove" : "load", loader);
    if (ree.opts.env == "dev" && ree.opts.mode != "static") {
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
            }
        }, 5000);
    }
    if (ree.opts.twind) {
        logger("Starting TWIND", "DEBUG");
        ree.twind = await Import("@twind/cdn");
        if(ree.twConfig){
            ree.twConfig = await Import("/__reejs/serve/tailwind.config.js");
        }
        ree.twind.setup({
            theme: { ...ree?.twConfig?.theme },
            darkMode: ree?.twConfig?.darkMode,
        });
        $("head style#old-twind")?.remove();
        $("html").removeAttribute("hidden");
    }
    if (ree.opts.run != "none" && !ree.needsHydrate) eval(`${ree.opts.run}();//# sourceURL=reejs/afterInit`);
    delete ree.opts.run;
    delete ree.opts.twind;
    
    $$("script").forEach(s => s.remove());
    $$("head link[rel='preload']").forEach(s => s.remove());
}