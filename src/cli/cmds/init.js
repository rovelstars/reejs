import {exec} from "child_process";
import readline from "readline";

import DynamicImport from "../../imports/dynamicImport.js";
import NativeImport from "../../imports/nativeImport.js";
import chalk from "../../utils/chalk.js";

let pkgJson = DynamicImport(await import("../../../package.json", {
  assert: {type: "json"},
}));
let pkgJson2 = DynamicImport(await import("../../imports/package.json", {
  assert: {type: "json"},
}));
let pkgJson3 = DynamicImport(await import("../../server/package.json", {
  assert: {type: "json"},
}));
let pkgJson4 = DynamicImport(await import("../../react/package.json", {
  assert: {type: "json"},
}));
import {Import} from "../../imports/URLImport.js";
let ora = await Import("ora@6.1.2");
export default function(prog) {
  prog.command("init [name]")
      .describe("Initialize a new project")
      .option("-f, --features", "Features to include in the project", "")
      .action(async (name, opts) => {
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
        let spinner = ora("Initializing project...").start();
        fs.mkdirSync(path.join(process.cwd(), name));
        fs.writeFileSync(path.join(process.cwd(), name, ".reecfg"),
                         JSON.stringify({
                           name : name,
                           version : "0.0.1",
                           features : {},
                         },
                                        null, 2));
        let optionalPkgs = {};
        if (opts.features.includes("react")) {
          optionalPkgs = {
            ...optionalPkgs,
            "@reejs/react" : pkgJson4.version,
          };
        }
        fs.writeFileSync(path.join(process.cwd(), name, "package.json"),
                         JSON.stringify({
                           name : name,
                           version : "0.0.1",
                           type : "module",
                           main : "src/index.js",
                           dependencies : {
                             reejs : `^${pkgJson.version}`,
                             "@reejs/imports" : `^${pkgJson2.version}`,
                             "@reejs/server" : `^${pkgJson3.version}`,
                             ...optionalPkgs,
                           },
                           license : "MIT",
                         },
                                        null, 2));
        fs.mkdirSync(path.join(process.cwd(), name, "src", "pages", "api"), {
          recursive : true,
        });
        fs.mkdirSync(path.join(process.cwd(), name, "public"), {
          recursive : true,
        });
        if (opts.features.includes("tailwind")) {
          fs.writeFileSync(path.join(process.cwd(), name, "twind.config.js"),
                           `import { defineConfig } from "@twind/core";
import presetAutoprefix from "@twind/preset-autoprefix";
import presetTailwind from "@twind/preset-tailwind";

export default defineConfig({
  presets: [presetAutoprefix, presetTailwind],
  darkMode: "class",
});`);
        }
        if (opts.features.includes("react")) {
          fs.writeFileSync(
              path.join(process.cwd(), name, "src", "pages", "index.jsx"),
              `export default function(){
			return <h1${
                  opts.features.includes("tailwind")
                      ? ' className="text-3xl font-bold text-violet-600"'
                      : ''}>Hello from Reejs!</h1>
		}`);
          fs.writeFileSync(
              path.join(process.cwd(), name, "src", "pages", "_app.jsx"),
              `import App from "@reejs/react/app";
export default ${
                  opts.features.includes("tailwind")
                      ? "App"
                      : "function({ children }){return <App children={children} className=\"!block\" style={{display: 'none'}} />}"};`);
          fs.mkdirSync(path.join(process.cwd(), name, "src", "components"), {
            recursive : true,
          });
        }
        if (opts.features.includes("tailwind")) {
          fs.writeFileSync(
              path.join(process.cwd(), name, "src", "pages", "_twind.js"),
              `import install from "@twind/with-react";
import config from "../../twind.config.js";
export default install(config);`);
        }
        fs.mkdirSync(path.join(process.cwd(), name, "src", "styles"));
        fs.writeFileSync(
            path.join(process.cwd(), name, "src", "styles", "index.css"),
            `/* insert styles here */`);

        // optional dependencies that are added to import maps if asked in
        // features
        let optionalDeps = {};
        let optionalDeps2 = {};
        if (opts.features.includes("react")) {
          optionalDeps.react = "https://esm.sh/preact@10.13.2/compat",
          optionalDeps["render"] =
              "https://esm.sh/preact-render-to-string@6.0.2"
          optionalDeps["@hono/serve-static"] =
              "https://esm.sh/@hono/node-server@0.3.0/serve-static?bundle"
          optionalDeps["debug"] = "https://esm.sh/preact@10.13.2/debug";
          optionalDeps2.debug = optionalDeps.debug;
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
        fs.writeFileSync(
            path.join(process.cwd(), name, "import_map.json"),
            JSON.stringify({
              imports : {
                "hono" : "https://esm.sh/hono@3.0.3?bundle",
                "@hono/node-server" :
                    "https://esm.sh/@hono/node-server@0.3.0?bundle",

                ...optionalDeps,
              },
              browserImports : {
                ...optionalDeps2,
              },
            },
                           null, 2));
        spinner.succeed("Project initialized!");
        // ask user what package manager to use
        let rl = readline.createInterface({
          input : process.stdin,
          output : process.stdout,
        });
        rl.question(
            `${chalk.blue("What package manager do you want to use?")} ${
                chalk.yellow("(npm/yarn/pnpm/none)")} `,
            (answer) => {
              rl.close();
              // install dependencies using the package manager
              if (answer === "npm") {
                spinner = ora(`${chalk.hex("#805ad5")("[REEJS]")} ${
                                  chalk.yellow("Installing Dependencies...")}`)
                              .start();
                exec("npm install", {cwd : path.join(process.cwd(), name)},
                     (err, stdout, stderr) => {
                       if (err) {
                         console.log(err);
                       }
                       spinner.succeed(`${chalk.hex("#805ad5")("[REEJS]")} ${
                           chalk.blue("Dependencies installed!")}`);
                       console.log(stdout);
                       console.log(stderr);
                     });
              } else if (answer === "yarn") {
                spinner = ora(`${chalk.hex("#805ad5")("[REEJS]")} ${
                                  chalk.yellow("Installing Dependencies...")}`)
                              .start();
                exec("yarn install", {cwd : path.join(process.cwd(), name)},
                     (err, stdout, stderr) => {
                       if (err) {
                         console.log(err);
                       }
                       spinner.succeed(`${chalk.hex("#805ad5")("[REEJS]")} ${
                           chalk.blue("Dependencies installed!")}`);
                       console.log(stdout);
                       console.log(stderr);
                     });
              } else if (answer === "pnpm") {
                spinner = ora(`${chalk.hex("#805ad5")("[REEJS]")} ${
                                  chalk.yellow("Installing Dependencies...")}`)
                              .start();
                exec("pnpm install", {cwd : path.join(process.cwd(), name)},
                     (err, stdout, stderr) => {
                       if (err) {
                         console.log(err);
                       }
                       spinner.succeed(`${chalk.hex("#805ad5")("[REEJS]")} ${
                           chalk.blue("Dependencies installed!")}`);
                       console.log(stdout);
                       console.log(stderr);
                     });
              } else {
                console.log("%c[REEJS] %cSkipped Installing Dependencies!",
                            "color: #805ad5", "color:yellow");
              }
            });
      });
}
