import runtime from "@reejs/imports/env.js";
import Import, { NativeImport, URLImport, DynamicImport } from "@reejs/imports/index.js";
import { save } from "@reejs/imports/debug.js";
import { reejsDir as dir } from "@reejs/imports/env.js";
let reejsDir = dir; // make reejsDir mutable
import SpecialFileImport from "@reejs/imports/specialFileImport.js";
let path = await NativeImport("node:path");
let processCwd = globalThis?.process?.cwd?.() || globalThis?.Deno.cwd();
//create __dirname
Object.defineProperty(globalThis, "__dirname", {
  get: () => path.dirname(processCwd),
  configurable: true,
  enumerable: true,
});

export default async function (prog) {
  prog
    .command("x [file]")
    .describe("run a local file/npm module")
    .option("-e, --eval", "Run some code along with the file. Mentioned file can be accessed with `module.<method/variable>`", "")
    .option("-a", "Arguments to pass to the file, adds `-` before your args.", "")
    .option("--args", "Arguments to pass to the file, adds `--` before your args.", "")
    .action(async function (file, opts) {
      let fs = await NativeImport("node:fs");
      if (!file) {
        console.log("%c[REEJS] %cNo file/URL specified!", "color: #805ad5", "color: red");
        return;
      }
      globalThis.Import = Import;
      globalThis.NativeImport = NativeImport;
      globalThis.URLImport = URLImport;
      globalThis.DynamicImport = DynamicImport;
      globalThis.__REEJS_DIR__ = reejsDir;
      if(file.startsWith("http:/") && !file.startsWith("http://")) file = file.replace("http:/", "http://");
      if(file.startsWith("https:/") && !file.startsWith("https://")) file = file.replace("https:/", "https://");
      if (file.startsWith("npm:") || file.startsWith("http://") || file.startsWith("https://")) {
        if (opts.args != "" && opts.a != "") {
          if (opts.args != "") opts.args = opts.args.split(",").map((x) => "--" + x);
          if (opts.a != "") opts.a = opts.a.split(",").map((x) => "-" + x);
          //change process.argv and Deno.args
          if (globalThis?.Deno) {
            throw new Error("REEJS: Cannot change Deno.args when running in Deno. Use `deno run` instead of `reejs x` to run a file from a URL.");
          }

          process.argv = ["node", file, ...opts.args, ...opts.a];
        }
        if (file.startsWith("npm:")) {
          if (!globalThis.Deno) {//we need to polyfill because esm.sh sometimes import deno, like for esm.sh/server
            globalThis.Deno = (await Import("npm:@deno/shim-deno@0.16.0", { internalDir: true })).Deno;
          }
          file = file.replace("npm:", "https://esm.sh/");
          let pkgjson = await fetch(file + "/package.json");
          pkgjson = await pkgjson.json();
          if (pkgjson?.bin) {
            let bin = pkgjson.bin[Object.keys(pkgjson.bin)[0]];
            file = path.join(file, bin).replace("https:/", "https://");
          }
        }
        if (!globalThis.Deno) {
          globalThis.Deno = (await Import("npm:@deno/shim-deno@0.16.0", { internalDir: true })).Deno;
        }
        let module = await URLImport(file);
        if (opts.e || opts.eval) {
          eval(opts.e || opts.eval);
        }
        return;
      } else {
        if (!globalThis.Deno) {
          globalThis.Deno = (await Import("npm:@deno/shim-deno@0.16.0", { internalDir: true })).Deno;
        }
        try {
          let checkAbsolute = path.isAbsolute(file);
          if(checkAbsolute) process.env.USED_BY_CLI_APP="true";
          //await import(path.join(processCwd, await SpecialFileImport(path.join(processCwd, file), null, runtime)));
          if(!checkAbsolute) file = path.join(processCwd, file);
          await import(path.join(checkAbsolute?"":processCwd, await SpecialFileImport(file, null, runtime)));
          if (opts.e || opts.eval) {
            eval(opts.e || opts.eval);
          }
        } catch (e) {
          save(e);
        }
      }
    });
}
