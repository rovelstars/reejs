import { Import } from "./URLImport.js";
export default async function getJSR_URL(_name) {
  let name = _name;
  if (!name.startsWith("jsr:")) throw new Error("Invalid JSR URL: " + name);
  name = name.replace("jsr:", "");
  if (name.startsWith("/")) name = name.slice(1);
  let _ver, _pack, _file;
  if (name.startsWith("@")) {
    //scoped package
    [, _pack, _ver] = name.split("@");
    _pack = "@" + _pack;
  } else if (name.includes("@")) {
    //normal package, but has version
    [_pack, _ver] = name.split("@");
  } else {
    //normal package, but no version
    _pack = name;
  }

  if (_pack.startsWith("@") && _pack.includes("/", 2)) {
    //scoped package. we need to remove addtional paths if any
    //remove anything after 2nd slash
    _pack = _pack.split("/", 2).join("/");
  } else if (_pack.includes("/")) {
    //non scoped package
    [_pack, ..._file] = _pack.split("/");
  }
  try {
    [_ver, ..._file] = _ver?.split?.("/");
  } catch (e) {}
  if (Array.isArray(_file)) _file = _file.join("/");
  let data = "";
  let _c = 0; //count
  while (data == "") {
    try {
      data = await (await fetch(`https://jsr.io/${_pack}/meta.json`)).json();
    } catch (e) {
      console.trace(
        `Failed to fetch: https://jsr.io/${_pack}/meta.json [${_c++} tries]`
      );
      if (_c > 5)
        throw new Error(
          "Failed to fetch the meta.json file after 5 tries. Maybe the package does not exist?"
        );
    }
  }
  let [maxSatisfying, parse, parseRange, format] = (
    await Promise.all([
      Import("https://deno.land/std@0.217.0/semver/max_satisfying.ts", {
        internalDir: true,
      }),
      Import("https://deno.land/std@0.217.0/semver/parse.ts", {
        internalDir: true,
      }),
      Import("https://deno.land/std@0.217.0/semver/parse_range.ts", {
        internalDir: true,
      }),
      Import("https://deno.land/std@0.217.0/semver/format.ts", {
        internalDir: true,
      }),
    ])
  ).map(e => Object.values(e)[0]); //this values() function is used to get the value of the first property, which is the function we need.
  let versions = Object.keys(data.versions).map(v => parse(v));
  let requirement = parseRange(_ver || "*");
  let found = format(maxSatisfying(versions, requirement));
  data = "";
  _c = 0;
  while (data == "") {
    try {
      data = await (
        await fetch(`https://jsr.io/${_pack}/${found}_meta.json`)
      ).json();
    } catch (e) {
      console.trace(
        `Failed to fetch: https://jsr.io/${_pack}/${found}_meta.json [${_c++} tries]`
      );
      if (_c > 5)
        throw new Error("Failed to fetch the meta.json file after 5 tries");
    }
  }
  _file = data?.exports?.[`.${_file ? "/" + _file : ""}`] || "./main.ts";
  return new URL(_file, `https://jsr.io/${_pack}/${found}/`).toString();
}
