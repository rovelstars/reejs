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
            document.addEventListener('click', (e) => this.onClick(e));
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
    onClick(e) {
        this.reconstructDOM(this.handleLinkClick(e));
    }
    onPop(e) {
        this.reconstructDOM(this.handlePopState(e));
    }
    shouldHit = false;
    async reconstructDOM(c) {
        if (!this.enabled) return logger("Bypassing Router Because it Failed to Start.", "🚦");
        if (c.next == location.href) {
            if (!this.shouldHit) logger("ReeBlaze was smart enough to not reender the same page!", "🚦");
            if (this.shouldHit) logger("ReeBlaze got forced to reender 😩!", "🚦")
            this.shouldHit = true;
            setTimeout(() => { this.shouldHit = false }, 500); //😏 you know what ure doing right?
        }
        let foundRoute = this.router.lookup(c.next.replace(location.origin, ""));
        if (!foundRoute) foundRoute = this.router.lookup(c.next.replace(location.origin, "").slice(0, -1));
        if (foundRoute) {
            logger(`Found Route For ${c.next} | ${foundRoute.payload}`, "🚦");
            logger(`(Type: ${c.type}) Routing > ${c.next} from ${c.prev ? c.prev : "History"}`, "🚦");
            let page = await Import(foundRoute.payload);
            ree.pageUrl = foundRoute.payload;
            ree.reeact.render(ree.html`<${page.default} />`,$("#app"));
        }
        else {
            logger(`No Route Found For ${c.next}`, "🚦");
            logger(`Defaulting To /404`, "🚦");
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
        // addToPushState(next);
        logger(`History 👈 "${document.location}"`, "🥏");
        return this.handleLinkClick(e, true);
    }
    addToHistory(url, state = {}) {
        logger(`History 👉 "${url}"`, "🥏");
        window.history.pushState(state, "", url);
    }
    fullURL(url) {
        const href = new URL(url || window.location.href).href;
        return href;
    }
}