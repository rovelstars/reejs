//read all versions from ../package.json, ../src/imports/package.json, ../src/server/package.json, ../src/react/package.json, ../src/utils/package.json
// modify version as follows:
// increment the major number of semver, ie, <major number>.<mid number>.<last number> -> <major number+1>.<mid number>.<last number>

import fs from "node:fs";
import path from "node:path";

let reejs_version = JSON.parse(
  fs.readFileSync(
    path.dirname(new URL(import.meta.url).pathname) + "/../package.json"
  )
);

let imports_version = JSON.parse(
  fs.readFileSync(
    path.dirname(new URL(import.meta.url).pathname) +
      "/../src/imports/package.json"
  )
);
let utils_version = JSON.parse(
  fs.readFileSync(
    path.dirname(new URL(import.meta.url).pathname) +
      "/../src/utils/package.json"
  )
);
let react_version = JSON.parse(
  fs.readFileSync(
    path.dirname(new URL(import.meta.url).pathname) +
      "/../src/react/package.json"
  )
);
let server_version = JSON.parse(
  fs.readFileSync(
    path.dirname(new URL(import.meta.url).pathname) +
      "/../src/server/package.json"
  )
);

function bumpVersion(version) {
  let parts = version.split(".");
  parts[0] = parseInt(parts[0]) + 1;
  parts[1] = 0;
  parts[2] = 0;
  if (parts[3]) delete parts[3];
  return parts.join(".");
}

reejs_version.version = bumpVersion(reejs_version.version);
imports_version.version = bumpVersion(imports_version.version);
utils_version.version = bumpVersion(utils_version.version);
react_version.version = bumpVersion(react_version.version);
server_version.version = bumpVersion(server_version.version);

fs.writeFileSync(
  path.dirname(new URL(import.meta.url).pathname) + "/../package.json",
  JSON.stringify(reejs_version, null, 2)
);
fs.writeFileSync(
  path.dirname(new URL(import.meta.url).pathname) +
    "/../src/imports/package.json",
  JSON.stringify(imports_version, null, 2)
);
fs.writeFileSync(
  path.dirname(new URL(import.meta.url).pathname) +
    "/../src/utils/package.json",
  JSON.stringify(utils_version, null, 2)
);
fs.writeFileSync(
  path.dirname(new URL(import.meta.url).pathname) +
    "/../src/react/package.json",
  JSON.stringify(react_version, null, 2)
);
fs.writeFileSync(
  path.dirname(new URL(import.meta.url).pathname) +
    "/../src/server/package.json",
  JSON.stringify(server_version, null, 2)
);

console.log("Bumped all versions.");
