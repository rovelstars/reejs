import Import, {
  NativeImport,
  DynamicImport,
  URLImport,
} from "@reejs/imports/index.js";
import dl from "@reejs/imports/URLImportInstaller.js";
import chalk from "@reejs/utils/chalk.js";
import { doctorReport } from "./doctor.js";
let fs = await NativeImport("node:fs");

export default async function (prog) {
  prog
    .command("repl")
    .describe("Start a quick repl to test out reejs")
    .action(async function () {
      if (globalThis.Deno) {
        console.error(
          "%c[ERROR] %cReePL is not supported in Deno due to no support for %c`node:repl`%c by Deno itself.",
          "color:#7c3aed",
          "color:#db2777",
          "color: blue",
          "color:#db2777"
        );
        Deno.exit(1);
      }
      let repl = await NativeImport("node:repl");
      if (!globalThis.Deno && !globalThis.Bun) {
        let modulesLoadTimeout = setTimeout(() => {
          //man talk about a hack
          console.log(
            "%c[DENO] Setting up Deno namespace shim",
            "color:yellow;"
          );
        }, 1000);
        //setup Deno namespace shim
        globalThis.Deno = DynamicImport(
          await Import("https://esm.sh/@deno/shim-deno@0.16.0", {
            internalDir: true,
          })
        ).Deno;
        if (!Deno.readFile) {
          Deno.readFile = async function (path) {
            return fs.readFileSync(path);
          };
        }
        clearTimeout(modulesLoadTimeout);
      }
      console.log(
        "%c[REPL] %cStarting ReePL",
        "color:#7c3aed",
        "color:#db2777"
      );
      let r = repl.start(chalk.hex("db2777")("> "));
      Object.defineProperty(r.context, "dl", {
        value: dl,
      });
      Object.defineProperty(r.context, "NativeImport", {
        value: NativeImport,
      });
      Object.defineProperty(r.context, "Import", {
        value: Import,
      });
      Object.defineProperty(r.context, "DynamicImport", {
        value: DynamicImport,
      });
      Object.defineProperty(r.context, "URLImport", {
        value: URLImport,
      });
      Object.defineProperty(r.context, "doctor", {
        value: doctorReport,
      });
    });
}
