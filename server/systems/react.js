(async () => {
  if (globalThis.fetch) {
    globalThis._fetch = globalThis.fetch;
  }
  if (!globalThis.fetch) {
    globalThis._fetch = await import("../utils/fetch.js");
    globalThis._fetch = globalThis._fetch.default;
  }
  let SSRrender;
  let shouldSSR = (mode == "ssr" || mode == "auto");
  let shouldCSR = (mode == "csr");
  if (shouldSSR) {
    SSRrender = await Import(import_maps["preact-ssr"]);
    console.log("Rendering with SSR Mode");
  }
  let pages = await genPages();
  let apis = await genPages(true);
  let router = createRouter();
  let cachedPages = [];
  if (shouldCSR) {
    console.log("Rendering with CSR Mode");
    let domains = Object.keys(import_maps).map(e=>{let link = import_maps[e];return link.split("/").slice(0, 3).join("/")});
    domains = Array.from(new Set(domains));
    router.get("/**",async(req,res)=>{
      return `<!DOCTYPE html>
      <html hidden>
      <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${(domains.length>0)?domains.map(e=>`<link rel="preconnect" href="${e}">`).join("\n"):""}
      </head>
      <body>
      <div id="app">
      </div>
      <script src="/__reejs/assets/shell.js?h=${__hash}" type="module"></script>
      <script type="module">
      ree.routes=${JSON.stringify(pages)};
      ree.req={
        context:${JSON.stringify(req?.context)}
      };
      ree.hash="${__hash}";
      ree.import_maps=${JSON.stringify(import_maps)};
      ree.needsHydrate="true";
      ree.init({env:"${isProd ? "prod" : "dev"}",mode: "csr",twind: true ,run: "none"});
      </script>
      </body>
      </html>`;
    })
  }
  if (shouldSSR) {
    apis.forEach(async (api) => {
      router.get(api.path, async (req, res) => api.router.default(req, res));
      console.log(`[SERVER] Registering API Route ${api.path}`);
    });
    pages.forEach(async (page) => {
      router.get(page.path, async (req, res) => {
        let resp;
        if (page.component?.config?.cache || !cachedPages.find(p => p.path == page.path)) {
          let cached = cachedPages.find(p => p.path == page.path);
          if (cached) {
            return cached.resp;
          }
          else {
            if (page.component?.config?.shallowRender) {
              try {
                resp = await SSRrender.shallowRender(html`<${page.component.default} req=${req} />`)
              }
              catch (e) {
                console.log(`[SERVER] Error while rendering ${page.path}`);
                if (page.component.REE || page.component.ErrorRender) {
                  resp = await SSRrender.shallowRender(html`<${page.component.REE || page.component.ErrorRender} req=${req} e=${e} />`);
                }
                else {
                  console.log(`[ERROR]`, e);
                  return HTTPCat(500, e.message);
                }
              }
            }
            else {
              try {
                resp = await SSRrender(html`<${page.component.default} req=${req} />`);
              }
              catch (e) {
                if (page.component.REE || page.component.ErrorRender) {
                  resp = await SSRrender(html`<${page.component.REE || page.component.ErrorRender} req=${req} e=${e} />`);
                }
                else {
                  console.log(`[ERROR]`, e);
                  return HTTPCat(500, e.message);
                }
              }
            }
            let headel = "";
            if (page.component.head) {
              headel = await SSRrender(html`<${page.component.head} />`);
            }
            let cssTW = "";
            if (twindSSR) {
              cssTW = twind.extract(resp).css;
            }
            resp = `<!DOCTYPE html>
          <html ${(!twindSSR && page.component?.config?.twind) ? "hidden" : ""}>
          <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          ${headel}
          ${twindSSR ? `<style id="old-twind">${cssTW}</style>` : ""}
          </head>
          <body>
          <div id="app">
          ${resp}
          </div>
          <script src="/__reejs/assets/shell.js?h=${__hash}" type="module"></script>
          <script type="module">
          ree.routes=${JSON.stringify(pages)};
          ree.pageUrl="${encodeURI(page.file)}";
          ree.req={
            context:${JSON.stringify(req.context)}
          };
          ree.hash="${__hash}";
          ree.import_maps=${JSON.stringify(import_maps)};
          ree.needsHydrate=${page.component?.config?.hydrate ? "true" : "false"};
          ${page.component?.config?.runBeforeInit ? `(${page.component.config.runBeforeInit.toString()})();` : ""}
          ree.init({env:"${isProd ? "prod" : "dev"}",mode: "ssr" ,twind: ${page.component?.config?.twind == true} ,run:\`${page.component?.config?.runAfterInit ? `(${page.component.config.runAfterInit.toString().replaceAll("`", "\\`").replaceAll("$", "\\$")})` : "none"}\`});
          </script>
          </body>
          </html>`;

          if(shouldMinify){
            let minifier = await Import("https://esm.sh/html-minifier-terser@7.0.0?target=node&bundle");
            let minified = await minifier.minify(resp,{
              removeAttributeQuotes: true,
              removeComments: true,
              removeCommentsFromCDATA: true,
              removeCDATASectionsFromCDATA: true,
              collapseWhitespace: true,
              collapseBooleanAttributes: true,
              removeAttributeQuotes: true,
              removeEmptyAttributes: true
            });
            console.log(`[SERVER] Minified ${page.path} from ${resp.length/1000} to ${minified.length/1000} kb, saved ${(resp.length - minified.length)/1000} kb!`);
            resp = minified;
          }
            //save to cache
            if (page.component?.config?.cache && readConfig(cfg, "allowCaching") == "true") {
              cachedPages.push({ path: req.url, resp });
              console.log(`[SERVER] Saving Rendered ${req.url} to cache...`);
            }
            return resp;
          }
        }
      });
      console.log(`[SERVER] Registering Route ${page.path}`);
    });
    //check if assets folder exists
    if (fs.existsSync(`${process.cwd()}/dist`)) {
      console.log(`[SERVER] Assets folder found, Serving assets`);
      //serve assets
      router.get("/assets/*", async (req, res, next) => {
        let file = req.url.split("?")[0].replace("/assets/", "");
        let filepath = `${process.cwd()}/dist/${file}`;
        if (fs.existsSync(filepath)) {
          try {
            return send(res, fs.readFileSync(filepath));
          } catch (e) { next(); }
        }
        next();
      });
    }
  }
  app.use(router);

  if (shouldCheckRoutes) {
    console.log("[SERVER] Checking Routes");
    pages.forEach(async page => {
      //change /:variable to /variable
      let pageTestPath = page.component?.config?.checkRoute ?? page.path.replace(/\/:([^\/]+)/g, "/$1");
      console.log(`[TEST] Checking Route ${pageTestPath}`);
      let res = await _fetch(`http://${process.platform == "win32" ? "localhost" : "127.0.0.1"}:${wasListening}${pageTestPath}`);
      if (res.status != 200) {
        console.log(`[WARN] Route ${page.path} is not working`);
      }
    });
    apis.forEach(async api => {
      let apiTestPath = api.router?.config?.checkRoute ?? api.path.replace(/\/:([^\/]+)/g, "/$1");
      console.log(`[TEST] Checking API Route ${apiTestPath}`);
      let res = await _fetch(`http://${process.platform == "win32" ? "localhost" : "127.0.0.1"}:${wasListening}${apiTestPath}`);
      if (res.status != 200) {
        console.log(`[WARN] API Route ${api.path} is not working`);
      }
    });
  }
  process.on("SIGINT", () => {
    console.log("[SERVER] Shutting down...");
    process.exit();
  });
})();