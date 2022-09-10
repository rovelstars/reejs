cli.command("pack-it")
  .alias(["packit"])
  .describe(`Pack your project for serverless deployment!`)
  .action(async () => {
    console.log("Packing Your Project for Static File Serving...");
    if (fs.existsSync(`${process.cwd()}/.packit`)) {
      fs.rmSync(`${process.cwd()}/.packit`, { recursive: true });
      fs.mkdirSync(`${process.cwd()}/.packit`);
    }
    let copySync = function (src, dest) {
      let exists = fs.existsSync(src);
      let stats = exists && fs.statSync(src);
      let isDirectory = exists && stats.isDirectory();
      if (isDirectory) {
        fs.mkdirSync(dest, { recursive: true });
        fs.readdirSync(src).forEach(function (childItemName) {
          copySync(path.join(src, childItemName),
            path.join(dest, childItemName));
        });
      } else {
        fs.copyFileSync(src, dest);
      }
    };
    const readdir = promisify(fs.readdir);
    const stat = promisify(fs.stat);
    let hash = () => {
      let text = "";
      let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      for (let i = 0; i < 5; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));
      text += "_";
      for (let i = 0; i < 5; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));
      return text;
    };
    let __hash = hash();
    async function getFiles(dir) {
      const subdirs = await readdir(dir);
      const files = await Promise.all(
        subdirs.map(async (subdir) => {
          const res = resolve(dir, subdir);
          return (await stat(res)).isDirectory() ? getFiles(res) : res;
        })
      );
      return files.reduce((a, f) => a.concat(f), []);
    }
    let genPages = async (api = false) => {
      let files = await getFiles(`${process.cwd()}/src/pages`);
      files = files.map((f) => f.replace(`${process.cwd()}/src/pages/`, "")).filter((f) => f.endsWith(".js") || f.endsWith(".jsx") || f.endsWith(".ts") || f.endsWith(".tsx"));
      if (api) {
        files = files.filter((f) => f.startsWith("api/"));
      }
      if (!api) {
        files = files.filter((f) => !f.startsWith("api/"));
      }
      let results = [];
      let parser;
      for (let file in files) {
        let savedAt;
        //the order of imports is tsx > ts > jsx > js
        if (files[file].endsWith(".jsx")) {
          if (!parser) parser = await Import("https://esm.sh/sucrase?target=node");
          let code = parser.transform(fs.readFileSync(`${process.cwd()}/src/pages/${files[file]}`, "utf8"), { transforms: ["jsx"] }).code;
          if (!fs.existsSync(`${process.cwd()}/.packit/src/pages`)) fs.mkdirSync(`${process.cwd()}/.packit/src/pages`, { recursive: true });
          fs.writeFileSync(`${process.cwd()}/.packit/src/pages/${files[file].slice(0,-4)+".js"}`, code);
          fs.rmSync(`${process.cwd()}/.packit/src/pages/${files[file]}`);
          savedAt = `${process.cwd()}/.packit/src/pages/${files[file].slice(0, -4)+".js"}`;
        }
        if (files[file].endsWith(".ts")) {
          if (!parser) parser = await Import("https://esm.sh/sucrase?target=node");
          let code = parser.transform(fs.readFileSync(`${process.cwd()}/src/pages/${files[file]}`, "utf8"), { transforms: ["typescript"] }).code;
          if (!fs.existsSync(`${process.cwd()}/.packit/src/pages`)) fs.mkdirSync(`${process.cwd()}/.packit/src/pages`, { recursive: true });
          fs.writeFileSync(`${process.cwd()}/.packit/src/pages/${files[file].slice(0,-3)+".js"}`, code);
          fs.rmSync(`${process.cwd()}/.packit/src/pages/${files[file]}`);
          savedAt = `${process.cwd()}/.packit/src/pages/${files[file].slice(0, -3)+".js"}`;
        }
        if (files[file].endsWith(".tsx")) {
          if (!parser) parser = await Import("https://esm.sh/sucrase?target=node");
          let code = parser.transform(fs.readFileSync(`${process.cwd()}/src/pages/${files[file]}`, "utf8"), { transforms: ["typescript", "jsx"] }).code;
          if (!fs.existsSync(`${process.cwd()}/.packit/src/pages`)) fs.mkdirSync(`${process.cwd()}/.packit/src/pages`, { recursive: true });
          fs.writeFileSync(`${process.cwd()}/.packit/src/pages/${files[file].slice(0, -4)+".js"}`, code);
          fs.rmSync(`${process.cwd()}/.packit/src/pages/${files[file]}`);
          savedAt = `${process.cwd()}/.packit/src/pages/${files[file].slice(0, -4)+".js"}`;
        }
          
          //if it's a js file, we don't need to do anything
          if(!savedAt) savedAt = `${process.platform == "win32" ? "file://" : `${process.cwd()}/src/pages/`}${files[file]}`
        
        results[file] = await Import(savedAt);
      }
      return Object.keys(results).map((route) => {
        let path = `/src/pages/${files[route]}`;
        if (path.endsWith(".ts")) path = path.slice(0, -3) + ".js";
        if (path.endsWith(".tsx")) path = path.slice(0, -4) + ".js";
        if (path.endsWith(".jsx")) path = path.slice(0, -4) + ".js";
        let pathReg = path
          .replace(/\/src\/pages|index|\.tsx|\.jsx|\.ts|\.js$/g, "");
        pathReg = pathReg
          .replace(/\[\.{4}\w+\]/, "**")
          .replace(/\[\.{3}\w+\]/, "*")
          .replace(/\[(.+)\]/, ":$1");
        if (process.platform == "win32") {
          pathReg = pathReg.replace(`${process.cwd()}\\src\\pages\\`, "").replaceAll("\\", "/");
          path.replace(`${process.cwd()}\\src\\pages\\`, "").replaceAll("\\", "/");
        }
        let obj;
        if (!api) {
          obj = { path: pathReg, component: results[route], file: path };
        }
        if (api) {
          obj = { path: pathReg, router: results[route], file: path };
        }
        return obj;
      });
    }
    
    //copy files recursively to .packit
    copySync(`${process.cwd()}/src`, `${process.cwd()}/.packit/src`);
    if (fs.existsSync(`${process.cwd()}/assets`)) copySync(`${process.cwd()}/assets`, `${process.cwd()}/.packit/assets`);
    copySync(`${process.cwd()}/import-maps.json`, `${process.cwd()}/.packit/import-maps.json`);
    copySync(`${process.cwd()}/.reecfg`, `${process.cwd()}/.packit/.reecfg`);
    copySync(`${dir}/server/csr`, `${process.cwd()}/.packit/__reejs/assets`);


    let import_maps = fs.readFileSync(`${process.cwd()}/import-maps.json`, "utf-8");
    import_maps = JSON.parse(import_maps).imports;
    let domains = Object.keys(import_maps).map(e => { let link = import_maps[e]; return link.split("/").slice(0, 3).join("/") });
    domains = Array.from(new Set(domains));
    let pages = await genPages();
    let apis = await genPages(true);
    let html = `<!DOCTYPE html>
          <html hidden>
          <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          ${(domains.length > 0) ? domains.map(e => `<link rel="preconnect" href="${e}">`).join("\n") : ""}
          </head>
          <body>
          <div id="app">
          </div>
          <script src="/__reejs/assets/shell.js" type="module"></script>
          <script type="module">
          ree.routes=${JSON.stringify(pages)};
          ree.req={
            context:{}
          };
          ree.hash="${__hash}";
          ree.import_maps=${JSON.stringify(import_maps)};
          ree.needsHydrate="true";
          ree.init({env:"prod",mode: "static",twind: true ,run: "none"});
          </script>
          </body>
          </html>`;
    
    fs.writeFileSync(`${process.cwd()}/.packit/__reejs/hash`, __hash, "utf-8");
    fs.writeFileSync(`${process.cwd()}/.packit/index.html`, html);
    
  })