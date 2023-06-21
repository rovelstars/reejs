import runtime from "@reejs/imports/env.js";
import { NativeImport, URLImport } from "@reejs/imports/index.js";
import SpecialFileImport from "@reejs/imports/specialFileImport.js";
let path = await NativeImport("node:path");
let processCwd = globalThis?.process?.cwd?.() || Deno.cwd();
//create __dirname
Object.defineProperty(globalThis, "__dirname", {
  get: () => path.dirname(processCwd),
  configurable: true,
  enumerable: true,
});

export default async function (prog) {
  prog
    .command("x [file] [command]")
    .describe("run a local file/npm module")
    .option("-e, --eval", "Run some code along with the file. Mentioned file can be accessed with `module.<method/variable>`", "")
    .option("-a", "Arguments to pass to the file, adds `-` before your args.", "")
    .option("--args", "Arguments to pass to the file, adds `--` before your args.", "")
    .action(async function (file,command, opts) {
      if (!file) {
        console.log("%c[REEJS] %cNo file/URL specified!", "color: #805ad5", "color: red");
        return;
      }
      if (file.startsWith("npm:")) {
        if (opts.args != "" && opts.a != "") {
          if (opts.args != "") opts.args = opts.args.split(",").map((x) => "--" + x);
          if (opts.a != "") opts.a = opts.a.split(",").map((x) => "-" + x);
          //change process.argv and Deno.args
          if (globalThis?.Deno) {
            throw new Error("REEJS: Cannot change Deno.args when running in Deno. Use `deno run` instead of `reejs x` to run a file from a URL.");
          }

          process.argv = ["node", file, ...opts.args, ...opts.a];
          if(command) process.argv = ["node", file, command, ...opts.args, ...opts.a];
          console.log(process.argv);
        }
        if (file.startsWith("npm:")) {
          file = file.replace("npm:", "https://esm.sh/");
          let pkgjson = await fetch(file + "/package.json");
          pkgjson = await pkgjson.json();
          if(pkgjson?.bin){
            let bin = pkgjson.bin[Object.keys(pkgjson.bin)[0]];
            file = path.join(file, bin).replace("https:/", "https://");
          }
        }
        console.log("%c[DOWNLOAD] %c" + file, "color: #805ad5", "color: #38b2ac");
        let module = await URLImport(file);
        if (opts.e || opts.eval) {
          eval(opts.e || opts.eval);
        }
        return;
      } else {
        if(!globalThis.Deno){
          globalThis.Deno = (await URLImport("https://esm.sh/@deno/shim-deno@0.16.0")).Deno;
        }
        await import(path.join(processCwd, await SpecialFileImport(path.join(processCwd, file),null, runtime)));
        if (opts.e || opts.eval) {
          eval(opts.e || opts.eval);
        }
      }
    });
}
