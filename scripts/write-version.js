import fs from "node:fs";
import path from "node:path";

let reejs_version = JSON.parse(
  fs.readFileSync(
    path.dirname(new URL(import.meta.url).pathname) + "/../package.json",
  ),
);
let create_version = JSON.parse(
  fs.readFileSync(
    path.dirname(new URL(import.meta.url).pathname) +
      "/../src/create/package.json",
  ),
);
let imports_version = JSON.parse(
  fs.readFileSync(
    path.dirname(new URL(import.meta.url).pathname) +
      "/../src/imports/package.json",
  ),
);
let utils_version = JSON.parse(
  fs.readFileSync(
    path.dirname(new URL(import.meta.url).pathname) +
      "/../src/utils/package.json",
  ),
);
let react_version = JSON.parse(
  fs.readFileSync(
    path.dirname(new URL(import.meta.url).pathname) +
      "/../src/react/package.json",
  ),
);
let server_version = JSON.parse(
  fs.readFileSync(
    path.dirname(new URL(import.meta.url).pathname) +
      "/../src/server/package.json",
  ),
);

let version = {
  reejs: reejs_version,
  imports: imports_version,
  utils: utils_version,
  react: react_version,
  server: server_version,
  create: create_version,
};

//generate js file exporting JSON.stringify(version)
let f = `export default ${JSON.stringify(version)};`;

fs.writeFileSync(
  path.dirname(new URL(import.meta.url).pathname) + "/../src/cli/version.js",
  f,
);
fs.writeFileSync(
  path.dirname(new URL(import.meta.url).pathname) + "/../src/create/version.js",
  f,
);
fs.writeFileSync(
  path.dirname(new URL(import.meta.url).pathname) +
    "/../src/imports/version.js",
  f,
);
fs.writeFileSync(
  path.dirname(new URL(import.meta.url).pathname) + "/../src/utils/version.js",
  f,
);
fs.writeFileSync(
  path.dirname(new URL(import.meta.url).pathname) + "/../src/react/version.js",
  f,
);
fs.writeFileSync(
  path.dirname(new URL(import.meta.url).pathname) + "/../src/server/version.js",
  f,
);

console.log("Version files updated!");
