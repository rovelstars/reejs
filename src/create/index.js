#!/usr/bin/env -S reejs x
import * as clack from 'npm:v132/@clack/prompts@0.7.0?bundle';
import pc from "npm:v132/picocolors@1.0.0?bundle";
import boxen from "npm:v132/boxen@7.1.1?bundle";
import gradient from "npm:v132/gradient-string@2.0.2?bundle";
import path from "npm:v132/pathe@1.1.1?bundle";
import {
  detectPackageManager,
  installDependencies
} from "npm:v132/nypm@0.3.3?bundle";
import fs from "node:fs";
import GetPackage from "./data.js";
let g = gradient(['#7c3aed', '#db2777']);

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

fs.writeFileSync(path.join(dir, "reecfg.json"), JSON.stringify({
}, null, 2), "utf-8");

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

packageManager = await detectPackageManager(path.join(dir));
//setup import maps URLs
let importmap = {}, browserimportmap = {};
if (features.includes("react")) {
  importmap["react"] = GetPackage("react");
  importmap["react-dom"] = GetPackage("react-dom");
  importmap["react-dom/server"] = GetPackage("react-dom/server");
  browserimportmap["react"] = GetPackage("react", { bundle: true });
  browserimportmap["react-dom"] = GetPackage("react-dom", { bundle: true });
  browserimportmap["react-dom/server"] = GetPackage("react-dom/server", { bundle: true });
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
}

fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify(pkg, null, 2), "utf-8");

if (shouldInstall) {
  const s = await clack.spinner();
  s.start(g("Installing dependencies"));
  await installDependencies({ cwd: dir, packageManager, silent: true });
  s.stop();
}
else {
  clack.note(`cd into ${pc.green(projectName)} and run \`${g("reejs install")}\``);
}
clack.outro(g("Let's get started!"));