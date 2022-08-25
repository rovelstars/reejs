//make a router class that enables client side routing
export default class Router {
    //constructor
    constructor() {
        //initialize the page url
        this.pageUrl = ree.pageUrl;
        //initialize the request object
        this.req = ree.req;
        //initialize the hash
        this.hash = ree.hash;
        this.loadRoutes();
        logger("ReeBlaze Initialized", "🚦");
        if (window?.history) {
            $$("a").forEach(a => { a.addEventListener('click', (e) => this.onClick(e)) });
            window.addEventListener('popstate', (e) => this.onPop(e));
            this.enabled = true;
        } else {
            logger("ReeBlaze Failed To Start Due To `window.history` API not available.", "🚦");
            this.enabled = false;
        }
    }
    async loadRoutes() {
        let radix = await Import("https://esm.sh/radix3");
        this.router = radix.createRouter();
        //initialize the routes array
        this.routes = ree.routes;
        this.routes.forEach(route => {
            this.router.insert(route.path, { payload: route.file });
        });
    }
    lookup(url) {
        return this.router.lookup(url);
    }
    onClick(e) {
        this.reconstructDOM(this.handleLinkClick(e));
    }
    onPop(e) {
        this.reconstructDOM(this.handlePopState(e));
    }
    async reconstructDOM(c) {
        if (!this.router) await this.loadRoutes();
        let foundRoute = this.router.lookup(c.next.replace(location.origin, ""));
        if (!foundRoute) foundRoute = this.router.lookup(c.next.replace(location.origin, "").slice(0, -1));
        if (foundRoute) {
            let page = await Import(foundRoute.payload);
            ree.pageUrl = foundRoute.payload;
            ree.reeact.render(ree.html`<${page.default} />`, $("#app"));
            if (!$("head style[data-twind]") && page.config?.twind) {
                logger("Starting TWIND", "DEBUG");
                ree.twind = await Import("@twind/cdn");
                ree.twind.setup();
            }
            $("head style#old-twind")?.remove();
            $$("a").forEach(a => { a.addEventListener('click', (e) => this.onClick(e)) });
            if(page.head){
                let newHead = document.createElement("head");
                let currentHead = document.head;
                ree.reeact.render(ree.html`<${page.head} />`, newHead);
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
            this.currentPage = page;
        }
        else {
            logger(`No Route Found For ${c.next}`, "🚦");
        }
    }

    handleLinkClick(e, pop) {
        let anchor;
        if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) {
            return { type: 'disqualified' };
        }

        // Find element containing href
        for (
            var n = e.target;
            n.parentNode;
            n = n.parentNode
        ) {
            if (n.nodeName === 'A') {
                anchor = n;
                break;
            }
        }

        // External links
        if (anchor && anchor.host !== location.host) {
            anchor.target = '_blank';
            return { type: 'external' };
        }

        // User opt-out
        if (anchor && 'cold' in anchor?.dataset) {
            return { type: 'disqualified' };
        }

        // Link qualified
        if (anchor?.hasAttribute('href')) {
            const ahref = anchor.getAttribute('href');
            const url = new URL(ahref, location.href);

            // Start router takeover
            e.preventDefault();

            // If anchor, scroll,
            if (ahref?.startsWith('#')) {
                scrollToAnchor(ahref);
                return { type: 'scrolled' };
            } else {
                const next = this.fullURL(url.href);
                const prev = this.fullURL();

                logger(`Link Clicked For ${next}`, "🚦");
                this.addToHistory(next);
                //TODO: add state when reejs itself supports them omai gawd...
                return { type: 'link', next, prev };
            }
        }
        else if (pop) {
            const next = this.fullURL(document.location);
            const prev = this.fullURL();
            return { type: "popstate", next, prev };
        }
        else {
            return { type: 'noop' };
        }
    }

    handlePopState(e) {
        e.preventDefault();
        return this.handleLinkClick(e, true);
    }
    addToHistory(url, state = {}) {
        window.history.pushState(state, "", url);
    }
    fullURL(url) {
        const href = new URL(url || window.location.href).href;
        return href;
    }
    async startPrefetchLinksInViewport() {
        //use intersection observer to prefetch links in viewport
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(async entry => {
                if (entry.isIntersecting) {
                    const link = entry.target;
                    const url = new URL(link.href, location.href);
                    const next = this.fullURL(url.href);
                    if (next !== location.href) {
                        if (!this.router) {
                            await this.loadRoutes();
                        }
                        let foundRoute = this.router.lookup(next.replace(location.origin, ""));
                        if (!foundRoute) foundRoute = this.router.lookup(next.replace(location.origin, "").slice(0, -1));
                        if (foundRoute) {
                            Import(foundRoute.payload);
                        }
                    }
                }
            });
        });
        const links = $$('a[href]');
        links.forEach(link => {
            observer.observe(link);
        });
    }
}