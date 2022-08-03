(async () => {
  let SSRrender = await Import("https://esm.sh/preact-render-to-string@5.2.0");
  let { h, Component, render } = await Import("preact");
  let htm = await Import("htm");
  let html = htm.bind(h);
  let pages = await genPages();
  let apis = await genPages(true);
  let router = createRouter();
  let cachedPages = [];
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
          resp = `<!DOCTYPE html>
          <html ${page.component?.config?.twind ? "hidden" : ""}>
          <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          ${headel}
          ${page.component.config?.hydrate ? `
          <link rel="preload" href="${encodeURI(page.file).replace("/src", "/__reejs/src?file=/src") + `&h=${__hash}`}" as="script" crossorigin="anonymous">
          ${page.component.config?.preloadComponents?.map((c) => `<link rel="preload" href="${encodeURI(c).replace("/src", "/__reejs/src?file=/src") + `&h=${__hash}`}" as="script" crossorigin="anonymous">`).join("") || ""}
          `: ""}
          <link rel="preload" href="https://unpkg.com/htm@3.1.1/dist/htm.module.js?module" as="script" crossorigin="anonymous">
          <link rel="preload" href="https://esm.sh/preact@10.10.0" as="script" crossorigin="anonymous">
          </head>
          <body>
          <div id="app">
          ${resp}
          </div>
          <script src="/__reejs/assets/shell.js?h=${__hash}" type="module"></script>
          <script type="module">
          ree.routes={pages:${JSON.stringify(pages)}};
          ree.pageUrl="${encodeURI(page.file)}";
          ree.req={
            context:${JSON.stringify(req.context)}
          };
          ree.hash="${__hash}";
          ree.importMaps=${JSON.stringify(import_map.imports)};
          ree.needsHydrate=${page.component?.config?.hydrate ? "true" : "false"};
          ${page.component?.config?.runBeforeInit ? `(${page.component.config.runBeforeInit.toString()})();` : ""}
          ree.init({env:"${isProd ? "prod" : "dev"}",twind: ${page.component?.config?.twind == true} ,run:\`${page.component?.config?.runAfterInit ? `(${page.component.config.runAfterInit.toString()})` : "none"}\`});
          </script>
          </body>
          </html>`;
          //save to cache
          if(page.component?.config?.cache){
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
  app.use(router);

  if (shouldCheckRoutes) {
    console.log("[SERVER] Checking Routes");
    pages.forEach(async page => {
      //change /:variable to /variable
      let pageTestPath = page.component?.config?.checkRoute ?? page.path.replace(/\/:([^\/]+)/g, "/$1");
      console.log(`[TEST] Checking Route ${pageTestPath}`);
      let res = await fetch(`http://${process.platform == "win32" ? "localhost" : "127.0.0.1"}:${wasListening}${pageTestPath}`);
      if (res.status != 200) {
        console.log(`[WARN] Route ${page.path} is not working`);
      }
    });
    apis.forEach(async api => {
      let apiTestPath = api.router?.config?.checkRoute ?? api.path.replace(/\/:([^\/]+)/g, "/$1");
      console.log(`[TEST] Checking API Route ${apiTestPath}`);
      let res = await fetch(`http://${process.platform == "win32" ? "localhost" : "127.0.0.1"}:${wasListening}${apiTestPath}`);
      if (res.status != 200) {
        console.log(`[WARN] API Route ${api.path} is not working`);
      }
    });
  }
})();