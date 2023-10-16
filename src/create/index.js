#!/usr/bin/env -S reejs x
import * as clack from 'https://esm.sh/v132/@clack/prompts@0.7.0?bundle';
import pc from "https://esm.sh/v132/picocolors@1.0.0?bundle";
import boxen from "https://esm.sh/v132/boxen@7.1.1?bundle";
import gradient from "https://esm.sh/v132/gradient-string@2.0.2?bundle";
import path from "https://esm.sh/v132/pathe@1.1.1?bundle";
import { execa, $ } from "https://esm.sh/v132/execa@8.0.1?bundle";
import fs from "node:fs";
let g = gradient(['#7c3aed', '#db2777']);

const dependencies = {
  "react": "18.2.0",
  "react-dom": "18.2.0",
  "preact": "10.17.1",
  "preact-render-to-string": "6.2.1"
};

function GetPackage(name, opts) {

  const { bundle = false, isReactPackage = false, extDeps = [] } = opts || {};
  //a name would be like "react" or "react-dom/client"
  //replace the name with the version, prefix with "https://esm.sh/", suffix with "@<version>"

  //if it is a react package, then append ?external=react,react-dom
  //use url search params to append the query.
  //if bundle is true, add bundle query
  const pkgName = name.split("/")[0];
  let scope = name.replace(pkgName, "");
  scope = scope.split("?")[0];
  let url = `https://esm.sh/${pkgName}${dependencies[pkgName] ? `@${dependencies[pkgName]}` : ""}${scope}`;
  url = new URL(url);
  if (isReactPackage) {
    url.searchParams.append("external", "react,react-dom");
  }
  if (extDeps.length) {
    url.searchParams.append("external", extDeps.join(","));
  }
  if (bundle) {
    url.searchParams.append("bundle", "");
  }
  return url.toString();
}

console.log("");
console.log(g.multiline(boxen("Welcome to Reejs Framework", { padding: 1, borderStyle: "round", })));
console.log("");

function checkCancel(value) {
  if (clack.isCancel(value)) {
    clack.cancel(g("Interrupted! Hope to see you again..."));
    process.exit(0)
  }
}
clack.intro(g("Let's create a new project!"));
const projectName = await clack.text({
  message: g("What would we create your next project?"),
  initialValue: "./",
  validate(value) {
    if (value.length === 0 || value == "./") return `Value is required!`;
    if (!value.startsWith("./") && !value.startsWith("../")) return `Provide a relative path!`;
    if (fs.existsSync(path.join(process.cwd(), value))) return `Directory already exists!`;
  },
});
checkCancel(projectName);


async function getFeatures() {
  let value = await clack.multiselect({
    message: g("Choose the features you want to include in your project"),
    options: [
      { label: "React", value: "react", hint: "Suggested if preact can't fullfill your needs" },
      { label: "Preact (compat)", value: "preact", hint: "Recommended for simple projects" },
      { label: "Twind CSS", value: "twind", hint: "Recommended for simple projects" },
      { label: "Tailwind CSS", value: "tailwind", hint: "Recommended when you need tailwind plugins" },
      { label: "API Server", value: "api" },
      { label: "Serve Static Files", value: "static" },
      { label: "Million.js", value: "million" },
    ]
  });

  checkCancel(value);
  //one cannot use both twind and tailwind
  function validate(value) {
    if (value.includes("twind") && value.includes("tailwind")) return `You cannot use both twind and tailwind!`;
    //one cannot use both react and preact
    if (value.includes("react") && value.includes("preact")) return `You cannot use both react and preact!`;
    //you cannot use million.js without react, and not with preact
    if (value.includes("million") && !value.includes("react")) return `You cannot use million.js without react!`;
    if (value.includes("million") && value.includes("preact")) return `You cannot use million.js with preact!`;

  }
  if (validate(value)) {
    clack.log.warn(pc.yellow(validate(value)));
    value = await getFeatures();
  }
  return value;
}

let features = await getFeatures();

let packageManager = await clack.select({
  message: g("Which package manager do you want to use (alongside URL Imports)?"),
  options: [
    { label: "npm", value: "npm" },
    { label: "pnpm", value: "pnpm" },
    { label: "yarn", value: "yarn" },
    { label: "bun", value: "bun" },
  ]
});

//ask whether it should install deps auto or not?
let shouldInstall = await clack.confirm({
  message: "Should we install dependencies for you?"
});

async function getLatestVersion(packageName) {
  let res = await fetch(`https://registry.npmjs.org/${packageName}`);
  let data = await res.json();
  return data["dist-tags"].latest;
}

let dir = path.join(process.cwd(), projectName);

fs.mkdirSync(path.join(dir, "src"), { recursive: true });
if (features.includes("api")) {
  fs.mkdirSync(path.join(dir, "src", "pages", "api"), { recursive: true });
  fs.writeFileSync(path.join(dir, "src", "pages", "api", "index.js"),
    `export default function (c) {\n  return c.json({ hello: "world" })\n}`, "utf-8");
}
if (features.includes("static")) {
  fs.mkdirSync(path.join(dir, "public"));
}
if (features.includes("react") || features.includes("preact")) {
  fs.mkdirSync(path.join(dir, "src", "pages"), { recursive: true });
  fs.mkdirSync(path.join(dir, "src", "components"), { recursive: true });
  fs.writeFileSync(path.join(dir, "src", "pages", "index.jsx"),
    `export default function(){\n  return <h1 ${(features.includes("tailwind") || features.includes("twind")) ? 'className="text-3xl font-bold text-violet-600"' : ''}>Hello from Reejs!</h1>\n}`, "utf-8");
  fs.writeFileSync(path.join(dir, "reecfg.json"), JSON.stringify({
  }, null, 2), "utf-8");
  fs.writeFileSync(
    path.join(dir, "src", "pages", "_app.jsx"),
    `import App from "@reejs/react/app";
export default ${features.includes("tailwind") || features.includes("twind")
      ? "App"
      : "function({ children }){return <App children={children} className=\"!block\" style={{display: 'none'}} />}"};`);
  fs.mkdirSync(path.join(dir, "src", "components"), {
    recursive: true,
  });
}

fs.writeFileSync(path.join(dir, "packit.config.js"), "");
fs.writeFileSync(path.join(dir, ".gitignore"), [
  "node_modules",
  "dist",
  ".reejs",
  "packit.build.js"
].join("\n"), "utf-8");

let pkg = {
  name: path.basename(projectName),
  version: "1.0.0",
  description: "",
  type: "module",
  scripts: {
    "dev": "reejs packit node -d",
    "build": "reejs packit node",
    "start": "node packit/index.js"
  },
  dependencies: {},
  devDependencies: {},
  packageManager
};
fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify(pkg, null, 2), "utf-8");
//setup import maps URLs
let importmap = {}, browserimportmap = {};
if (features.includes("react")) {
  importmap["react"] = GetPackage("react");
  importmap["react-dom"] = GetPackage("react-dom");
  importmap["react-dom/server"] = GetPackage("react-dom/server");
  browserimportmap["react"] = GetPackage("react", { bundle: true });
  browserimportmap["react-dom"] = GetPackage("react-dom", { bundle: true });
  browserimportmap["react-dom/client"] = GetPackage("react-dom/client", { bundle: true });
}
if (features.includes("preact")) {
  importmap["react"] = GetPackage("preact/compat");
  importmap["react-dom"] = GetPackage("preact/compat");
  importmap["preact"] = GetPackage("preact");
  importmap["preact/debug"] = GetPackage("preact/debug");
  importmap["preact-render-to-string"] = GetPackage("preact-render-to-string", {
    extDeps: ["preact"]
  });
  browserimportmap["react"] = GetPackage("preact/compat", { bundle: true });
  browserimportmap["react-dom"] = GetPackage("preact/compat", { bundle: true });
  browserimportmap["preact/debug"] = GetPackage("preact", { bundle: true });
}
if (features.includes("twind")) {
  importmap["@twind/core"] =
    "https://cdn.jsdelivr.net/npm/@twind/core/+esm";
  browserimportmap["@twind/core"] = importmap["@twind/core"];
  importmap["@twind/preset-autoprefix"] =
    "https://cdn.jsdelivr.net/npm/@twind/preset-autoprefix/+esm";
  browserimportmap["@twind/preset-autoprefix"] =
    importmap["@twind/preset-autoprefix"];
  importmap["@twind/preset-tailwind"] =
    "https://cdn.jsdelivr.net/npm/@twind/preset-tailwind/+esm";
  browserimportmap["@twind/preset-tailwind"] =
    importmap["@twind/preset-tailwind"];
  importmap["@twind/with-react"] =
    "https://cdn.jsdelivr.net/npm/@twind/with-react/+esm";
  browserimportmap["@twind/with-react"] =
    importmap["@twind/with-react"];
  importmap["@twind/with-react/inline"] =
    "https://cdn.jsdelivr.net/npm/@twind/with-react/inline/+esm";
  browserimportmap["@twind/with-react/inline"] =
    importmap["@twind/with-react/inline"];
  fs.writeFileSync(
    path.join(dir, "src", "pages", "_twind.js"),
    `import install from "@twind/with-react";
import config from "../../twind.config.js";
export default install(config);`);
  fs.writeFileSync(path.join(dir, "twind.config.js"),
    `import { defineConfig } from "@twind/core";
import presetAutoprefix from "@twind/preset-autoprefix";
import presetTailwind from "@twind/preset-tailwind";

export default defineConfig({
presets: [presetAutoprefix, presetTailwind],
darkMode: "class",
});`);
  fs.writeFileSync(path.join(dir, "tailwind.config.js"), "");
}
if (features.includes("tailwind")) {
  //tailwind doesn't work from url imports. use it from npm directly
  pkg.devDependencies["tailwindcss"] = await getLatestVersion("tailwindcss");
  //write tailwind.config.js
  fs.writeFileSync(path.join(dir, "tailwind.config.js"), "export default " + JSON.stringify({
    content: ["./src/**/*.{js,jsx,ts,tsx}"],
    theme: {
      extend: {},
    },
    plugins: [],
  }, null, 2), "utf-8");
  //write src/input.css
  fs.writeFileSync(path.join(dir, "src", "input.css"), "@tailwind base;\n@tailwind components;\n@tailwind utilities;", "utf-8");
}
if (features.includes("million")) {
  //install million.js
  //fetch latest version of million.js from npm api
  pkg.dependencies["million"] = await getLatestVersion("million");
  browserimportmap["million/react"] = GetPackage("million/react", { bundle: true, isReactPackage: true });
  fs.writeFileSync(path.join(dir, "packit.config.js"),
    `import million from 'million/compiler';\nexport default {\n  plugins: [\n    million.vite({auto: true}),\n  ]\n}`, "utf-8");
}
// TODO: work on below string to function.
importmap["hono"] = "https://esm.sh/v132/hono@3.6.3";
importmap["hono/compress"] = "https://esm.sh/v132/hono@3.6.3/compress";
importmap["@hono/node-server"] = "https://esm.sh/v132/@hono/node-server@1.1.1";
importmap["@hono/node-server/serve-static"] = "https://esm.sh/v132/@hono/node-server@1.1.1/serve-static";
pkg.dependencies["@reejs/utils"] = await getLatestVersion("@reejs/utils");
pkg.dependencies["@reejs/imports"] = await getLatestVersion("@reejs/imports");
pkg.dependencies["@reejs/server"] = await getLatestVersion("@reejs/server");
pkg.dependencies["@reejs/react"] = await getLatestVersion("@reejs/react");
pkg.devDependencies["reejs"] = await getLatestVersion("reejs");

fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify(pkg, null, 2), "utf-8");
fs.writeFileSync(path.join(dir, "reecfg.json"), JSON.stringify({
  features,
}, null, 2), "utf-8");
fs.writeFileSync(path.join(dir, "import_map.json"), JSON.stringify({
  imports: importmap,
  browserImports: browserimportmap
}, null, 2), "utf-8");

if (shouldInstall) {
  const s = await clack.spinner();
  s.start(g("Installing dependencies"));
  // check whether reejs is available globally
  let isAvailable = false;
  try {
    isAvailable = await $(`reejs --version`);
    if (isAvailable) isAvailable = 1;
  }
  catch (e) {
    isAvailable = false;
  }
  if (!isAvailable) {
    //check whether reejs is available at <file dir>/node_modules/.bin/reejs
    try {
      //use import.meta.url to get the current file's url
      //use path.dirname to get the directory of the file
      //use path.join to join the directory with node_modules/.bin/reejs
      isAvailable = await $`node ${path.join(path.dirname(import.meta.url), "node_modules", ".bin", "reejs")} --version`;
      if (isAvailable) isAvailable = 2;
    }
    catch (e) {
      isAvailable = false;
    }
  }
  if (isAvailable == 1) {
    //reejs is available globally. use it
    await $({ cwd: dir })`reejs install`;
  }
  else if (isAvailable == 2) {
    //reejs is available locally. use it
    await $({ cwd: dir })`node ${path.join(path.dirname(import.meta.url), "node_modules", ".bin", "reejs")} install`;
  }
  else {
    //reejs is not available. notifiy the user
    clack.log.warn(g("Reejs is not available globally or locally. Please install it manually"));
    clack.note(`cd into ${pc.green(projectName)} and run \`${g("reejs install")}\``);
  }
  s.stop();
}
else {
  clack.note(`cd into ${pc.green(projectName)} and run \`${g("reejs install")}\``);
}
clack.outro(g("Let's get started!"));