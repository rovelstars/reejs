//read all versions from ../package.json, ../src/imports/package.json, ../src/server/package.json, ../src/react/package.json, ../src/utils/package.json
// modify version as follows:
// if version doesnt include -test- then add -test-1
// else increment the number after -test-

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

function bumpVersion(version) {
  let newVersion = version;
  if (version.includes("-test-")) {
    let testNumber = parseInt(version.split("-test-")[1]);
    testNumber++;
    newVersion = version.split("-test-")[0] + "-test-" + testNumber;
  } else {
    newVersion = version + "-test-1";
  }
  return newVersion;
}

reejs_version.version = bumpVersion(reejs_version.version);
create_version.version = bumpVersion(create_version.version);
imports_version.version = bumpVersion(imports_version.version);
utils_version.version = bumpVersion(utils_version.version);
react_version.version = bumpVersion(react_version.version);
server_version.version = bumpVersion(server_version.version);

fs.writeFileSync(
  path.dirname(new URL(import.meta.url).pathname) + "/../package.json",
  JSON.stringify(reejs_version, null, 4),
);
fs.writeFileSync(
  path.dirname(new URL(import.meta.url).pathname) +
    "/../src/create/package.json",
  JSON.stringify(create_version, null, 4),
);
fs.writeFileSync(
  path.dirname(new URL(import.meta.url).pathname) +
    "/../src/imports/package.json",
  JSON.stringify(imports_version, null, 4),
);
fs.writeFileSync(
  path.dirname(new URL(import.meta.url).pathname) +
    "/../src/utils/package.json",
  JSON.stringify(utils_version, null, 4),
);
fs.writeFileSync(
  path.dirname(new URL(import.meta.url).pathname) +
    "/../src/react/package.json",
  JSON.stringify(react_version, null, 4),
);
fs.writeFileSync(
  path.dirname(new URL(import.meta.url).pathname) +
    "/../src/server/package.json",
  JSON.stringify(server_version, null, 4),
);

console.log("Bumped all versions.");
