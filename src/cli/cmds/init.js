import DynamicImport from "@reejs/imports/dynamicImport.js";
import NativeImport from "@reejs/imports/nativeImport.js";

let pkg = DynamicImport(await import("../version.js"));
let pkgJson = pkg.reejs;
let pkgJson2 = pkg.imports;
let pkgJson3 = pkg.server;
let pkgJson4 = pkg.react;

import { Import } from "@reejs/imports/URLImport.js";
export default function (prog) {
  prog.command("init [name]")
    .describe("Initialize a new project")
    .option("-f, --features", "Features to include in the project", "")
    .action(async (name, opts) => {
      let ora = await Import("ora@6.1.2?bundle", { internalDir: true });
      let fs = await NativeImport("node:fs");
      let path = await NativeImport("node:path");
      // mkdir name
      if (fs.existsSync(path.join(process.cwd(), name))) {
        console.log("%c[REEJS] %cA project with this name already exists!",
          "color: #805ad5", "color: yellow");
        return;
      }
      // start spinner
      if (opts.features) {
        opts.features = opts.features.split(",");
        console.log("%c[REEJS] %cFeatures to be installed: " + opts.features,
          "color: #805ad5", "color: green");
      }
      if (!opts.features) {
        console.log("%c[REEJS] %cNo features specified, creating a basic project.", "color: #805ad5", "color: blue");
      }
      let spinner = ora("Initializing project...").start();
      fs.mkdirSync(path.join(process.cwd(), name));
      fs.writeFileSync(path.join(process.cwd(), name, "reecfg.json"),
        JSON.stringify({
          name: name,
          version: "0.0.1",
          features: opts.features == "" ? [] : opts.features,
        },
          null, 2));
      let optionalPkgs = {};
      if (opts.features.includes("react")) {
        optionalPkgs = {
          ...optionalPkgs,
          "@reejs/react": `^${pkgJson4.version}`,
        };
      }
      fs.writeFileSync(path.join(process.cwd(), name, "package.json"),
        JSON.stringify({
          name: name,
          version: "0.0.1",
          type: "module",
          main: "src/index.js",
          dependencies: {
            reejs: `^${pkgJson.version}`,
            "@reejs/imports": `^${pkgJson2.version}`,
            "@reejs/server": `^${pkgJson3.version}`,
            ...optionalPkgs,
          },
          license: "MIT",
        },
          null, 2));
      fs.writeFileSync(path.join(process.cwd(), name, "packit.config.js"), "");
      if (opts.features.includes("api")) {
        fs.mkdirSync(path.join(process.cwd(), name, "src", "pages", "api"), {
          recursive: true,
        });
        fs.writeFileSync(path.join(process.cwd(), name, "src", "pages", "api", "index.js"),
          `export default function(c){
          return c.json({hello: "world"})
        }`);
      }
      if (opts.features.includes("static")) {
        fs.mkdirSync(path.join(process.cwd(), name, "public"), {
          recursive: true,
        });
      }
      if (opts.features.includes("react")) {
        fs.writeFileSync(
          path.join(process.cwd(), name, "src", "pages", "index.jsx"),
          `export default function(){
			return <h1${opts.features.includes("tailwind")
            ? ' className="text-3xl font-bold text-violet-600"'
            : ''}>Hello from Reejs!</h1>
		}`);
        fs.writeFileSync(
          path.join(process.cwd(), name, "src", "pages", "_app.jsx"),
          `import App from "@reejs/react/app";
export default ${opts.features.includes("tailwind")
            ? "App"
            : "function({ children }){return <App children={children} className=\"!block\" style={{display: 'none'}} />}"};`);
        fs.mkdirSync(path.join(process.cwd(), name, "src", "components"), {
          recursive: true,
        });
      }
      if (opts.features.includes("tailwind")) {
        fs.writeFileSync(
          path.join(process.cwd(), name, "src", "pages", "_twind.js"),
          `import install from "@twind/with-react";
import config from "../../twind.config.js";
export default install(config);`);
        fs.writeFileSync(path.join(process.cwd(), name, "twind.config.js"),
          `import { defineConfig } from "@twind/core";
import presetAutoprefix from "@twind/preset-autoprefix";
import presetTailwind from "@twind/preset-tailwind";

export default defineConfig({
  presets: [presetAutoprefix, presetTailwind],
  darkMode: "class",
});`);
        fs.writeFileSync(path.join(process.cwd(), name, "tailwind.config.js"), "");
      }
      if (opts.features.includes("css")) {
        fs.mkdirSync(path.join(process.cwd(), name, "src", "styles"), {
          recursive: true,
        });
        fs.writeFileSync(
          path.join(process.cwd(), name, "src", "styles", "index.css"),
          `/* insert styles here */`);
      }
      if (opts.features.length === 0) {
        fs.mkdirSync(path.join(process.cwd(), name, "src"), {
          recursive: true,
        });
        fs.writeFileSync(path.join(process.cwd(), name, "src", "index.js"),
          `console.log("Hello from Reejs!")`);
      }
      // optional dependencies that are added to import maps if asked in
      // features
      let optionalDeps = {};
      let optionalDeps2 = {};
      if (opts.features.includes("react")) {
        optionalDeps.react = "https://esm.sh/preact@10.16.0/compat",
          optionalDeps["preact-render-to-string"] =
          "https://esm.sh/preact-render-to-string@6.2.0";
        optionalDeps["react/debug"] = "https://esm.sh/preact@10.16.0/debug";
        optionalDeps2["react/debug"] = optionalDeps["react/debug"];
        optionalDeps2.react = optionalDeps.react;
      }
      if (opts.features.includes("tailwind")) {
        optionalDeps["@twind/core"] =
          "https://cdn.jsdelivr.net/npm/@twind/core/+esm";
        optionalDeps2["@twind/core"] = optionalDeps["@twind/core"];
        optionalDeps["@twind/preset-autoprefix"] =
          "https://cdn.jsdelivr.net/npm/@twind/preset-autoprefix/+esm";
        optionalDeps2["@twind/preset-autoprefix"] =
          optionalDeps["@twind/preset-autoprefix"];
        optionalDeps["@twind/preset-tailwind"] =
          "https://cdn.jsdelivr.net/npm/@twind/preset-tailwind/+esm";
        optionalDeps2["@twind/preset-tailwind"] =
          optionalDeps["@twind/preset-tailwind"];
        optionalDeps["@twind/with-react"] =
          "https://cdn.jsdelivr.net/npm/@twind/with-react/+esm";
        optionalDeps2["@twind/with-react"] =
          optionalDeps["@twind/with-react"];
        optionalDeps["@twind/with-react/inline"] =
          "https://cdn.jsdelivr.net/npm/@twind/with-react/inline/+esm";
        optionalDeps2["@twind/with-react/inline"] =
          optionalDeps["@twind/with-react/inline"];
      }
      if (opts.features.includes("react") || opts.features.includes("static") || opts.features.includes("api")) {
        optionalDeps["@hono/node-server"] =
          "https://esm.sh/@hono/node-server@1.1.1";
        optionalDeps["hono"] = "https://esm.sh/hono@3.4.3";
        if (opts.features.includes("cloudflare"))
          optionalDeps["hono/cloudflare"] = "https://esm.sh/hono@3.4.3/cloudflare";
        if (opts.features.includes("hono"))
          optionalDeps["hono/bun"] = "https://esm.sh/hono@3.4.3/bun";
        optionalDeps["@hono/node-server/serve-static"] =
          "https://esm.sh/@hono/node-server@1.1.1/serve-static";
        if (!opts.features.includes("cloudflare"))
          optionalDeps["hono/compress"] = "https://esm.sh/hono@3.4.3/compress";
      }
      fs.writeFileSync(
        path.join(process.cwd(), name, "import_map.json"),
        JSON.stringify({
          imports: {
            ...optionalDeps,
          },
          browserImports: {
            ...optionalDeps2,
          },
        },
          null, 2));
      spinner.succeed("Project initialized!");
      process.exit(0);
    });
}
