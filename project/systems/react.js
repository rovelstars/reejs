(async () => {
      //Import("https://examples.deno.land/deno-version.ts");
      let SSRrender = await Import("https://esm.sh/preact-render-to-string@5.2.0");
      let { h, Component, render } = await Import("https://esm.sh/preact@10.10.0");
      let htm = await Import("https://unpkg.com/htm?module");
      let html = htm.bind(h);
      let pages = await genPages();
      let apis = await genPages(true);
      app.use("*", (req, res, next) => { console.log(`[SERVER] GET -> ${req.url}`); next() });
      let router = createRouter();
      apis.forEach(async (api) => {
        router.get(api.path, async (req, res) => api.router.default(req, res));
        console.log(`[SERVER] Registering API Route ${api.path}`);
      });
      pages.forEach(async (page) => {
        router.get(page.path, async (req, res) => {
          let resp = SSRrender(html`<${page.component.default} req=${req}/>`);
          let headel = "";
          if (page.component.head) {
            headel = SSRrender(html`<${page.component.head} />`);
          }
          resp = `<!DOCTYPE html>
          <html>
          <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          ${headel}
          </head>
          <body>${resp}</body>
          </html>`;
          return resp;
        });
        console.log(`[SERVER] Registering Route ${page.path}`);
      });
      //check if assets folder exists
      if (fs.existsSync(`${process.cwd()}/src/assets`)) {
        console.log(`[SERVER] Assets folder found, Serving assets`);
        //serve assets
        router.get("/assets/*", async (req, res, next) => {
          let file = req.url.replace("/assets/", "");
          let filepath = `${process.cwd()}/src/assets/${file}`;
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
          let pageTestPath = page.path.replace(/\/:([^\/]+)/g, "/$1");
          console.log(`[TEST] Checking Route ${pageTestPath}`);
          let res = await fetch(`http://127.0.0.1:${wasListening}${pageTestPath}`);
          if (res.status != 200) {
            console.log(`[WARN] Route ${page.path} is not working`);
          }
        });
        apis.forEach(async api => {
          let apiTestPath = api.path.replace(/\/:([^\/]+)/g, "/$1");
          console.log(`[TEST] Checking API Route ${apiTestPath}`);
          let res = await fetch(`http://127.0.0.1:${wasListening}${apiTestPath}`);
          if (res.status != 200) {
            console.log(`[WARN] API Route ${api.path} is not working`);
          }
        });
      }
    })();