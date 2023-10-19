import runtime from "@reejs/imports/env.js";
import Import, {
  NativeImport,
  URLImport,
  DynamicImport,
} from "@reejs/imports/index.js";
import { save } from "@reejs/imports/debug.js";
import { reejsDir as dir } from "@reejs/imports/env.js";
let reejsDir = dir; // make reejsDir mutable
import SpecialFileImport from "@reejs/imports/specialFileImport.js";
let path = await NativeImport("node:path");
let processCwd = globalThis?.process?.cwd?.() || globalThis?.Deno.cwd();

export default async function (prog) {
  prog
    .command("x [file]")
    .describe("run a local file/npm module")
    .option(
      "-e, --eval",
      "Run some code along with the file. Mentioned file can be accessed with `module.<method/variable>`",
      ""
    )
    .option(
      "-a",
      "Arguments to pass to the file, adds `-` before your args.",
      ""
    )
    .option(
      "--args",
      "Arguments to pass to the file, adds `--` before your args.",
      ""
    )
    .option(
      "-s, --save",
      "Save the file locally (creates a soft-link to the transpiled file) in the same directory as the original file.",
      false
    )
    .option(
      "--deno",
      "Polyfill Deno APIs on Reejs. This is useful for running files that use Deno's API. Bun can't run this option right now.",
      false
    )
    .action(async function (file, opts) {
      let fs = await NativeImport("node:fs");
      if (!file) {
        console.log(
          "%c[REEJS] %cNo file/URL specified!",
          "color: #805ad5",
          "color: red"
        );
        return;
      }
      globalThis.Import = Import;
      globalThis.NativeImport = NativeImport;
      globalThis.URLImport = URLImport;
      globalThis.DynamicImport = DynamicImport;
      globalThis.__REEJS_DIR__ = reejsDir;
      if (file.startsWith("http:/") && !file.startsWith("http://"))
        file = file.replace("http:/", "http://");
      if (file.startsWith("https:/") && !file.startsWith("https://"))
        file = file.replace("https:/", "https://");
      if (
        file.startsWith("npm:") ||
        file.startsWith("http://") ||
        file.startsWith("https://")
      ) {
        if (opts.args != "" && opts.a != "") {
          if (opts.args != "")
            opts.args = opts.args.split(",").map(x => "--" + x);
          if (opts.a != "") opts.a = opts.a.split(",").map(x => "-" + x);
          //change process.argv and Deno.args
          if (globalThis?.Deno) {
            throw new Error(
              "REEJS: Cannot change Deno.args when running in Deno. Use `deno run` instead of `reejs x` to run a file from a URL."
            );
          }

          process.argv = ["node", file, ...opts.args, ...opts.a];
        }
        if (file.startsWith("npm:")) {
          if (!globalThis.Deno && !globalThis.Bun && opts.deno) {
            let modulesLoadTimeout = setTimeout(() => {
              //man talk about a hack
              console.log(
                "%c[DENO] Setting up Deno namespace shim",
                "color:yellow;"
              );
            }, 1000);
            //we need to polyfill because esm.sh sometimes import deno, like for esm.sh/server
            globalThis.Deno = (
              await Import("npm:@deno/shim-deno@0.16.0?bundle", {
                internalDir: true,
              })
            ).Deno;
            clearTimeout(modulesLoadTimeout);
          }
          file = file.replace("npm:", "https://esm.sh/");
          let pkgjson = await fetch(file + "/package.json");
          pkgjson = await pkgjson.json();
          if (pkgjson?.bin) {
            let bin = pkgjson.bin[Object.keys(pkgjson.bin)[0]];
            file = path.join(file, bin).replace("https:/", "https://");
          }
        }
        if (!globalThis.Deno && !globalThis.Bun && opts.deno) {
          let modulesLoadTimeout = setTimeout(() => {
            //man talk about a hack
            console.log(
              "%c[DENO] Setting up Deno namespace shim",
              "color:yellow;"
            );
          }, 1000);
          globalThis.Deno = (
            await Import("npm:@deno/shim-deno@0.16.0", { internalDir: true })
          ).Deno;
          clearTimeout(modulesLoadTimeout);
        }
        let module = await URLImport(file);
        if (opts.e || opts.eval) {
          eval(opts.e || opts.eval);
        }
        return;
      } else {
        if (!globalThis.Deno && !globalThis.Bun && opts.deno) {
          let modulesLoadTimeout = setTimeout(() => {
            //man talk about a hack
            console.log(
              "%c[DENO] Setting up Deno namespace shim",
              "color:yellow;"
            );
          }, 1000);
          globalThis.Deno = (
            await Import("npm:@deno/shim-deno@0.16.0", { internalDir: true })
          ).Deno;
          clearTimeout(modulesLoadTimeout);
        }
        try {
          let checkAbsolute = path.isAbsolute(file);
          if (checkAbsolute) process.env.USED_BY_CLI_APP = "true";
          //await import(path.join(processCwd, await SpecialFileImport(path.join(processCwd, file), null, runtime)));
          if (!checkAbsolute) file = path.join(processCwd, file);
          let _file = path.join(
            checkAbsolute ? "" : processCwd,
            await SpecialFileImport(file, null, runtime)
          );
          if(opts.s || opts.save) {
            //link _file to the original file's directory, and append ".packit.build.js" to the end of original filename
            file = file + ".packit.build.js";
            await fs.symlinkSync(_file, file);
          }
          await import(_file);
          if (opts.e || opts.eval) {
            eval(opts.e || opts.eval);
          }
        } catch (e) {
          save(e);
        }
      }
    });
}
