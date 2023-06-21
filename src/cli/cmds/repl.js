import Import, { NativeImport, DynamicImport,URLImport } from "@reejs/imports/index.js";
import dl from '@reejs/imports/URLImportInstaller.js';
import chalk from '@reejs/utils/chalk.js';
import {doctorReport} from "./doctor.js";
let fs = await NativeImport("node:fs");
let repl = await NativeImport("node:repl");

export default async function (prog) {
  prog
    .command("repl")
    .describe("Start a quick repl to test out reejs")
    .action(async function () {
      if(!globalThis.Deno){
        //setup Deno namespace shim
        console.log("%c[DENO] Setting up Deno namespace shim","color:yellow;");
        globalThis.Deno = (DynamicImport(await URLImport("https://esm.sh/@deno/shim-deno@0.16.0"))).Deno;
        if(!Deno.readFile){
          Deno.readFile = async function(path){
            return fs.readFileSync(path);
          }
        }
      }
      console.log("%c[REPL] %cStarting ReePL","color:#7c3aed", "color:#db2777");
      let r = repl.start(chalk.hex("db2777")("> "));
      Object.defineProperty(r.context, "dl", {
        value: dl
      });
      Object.defineProperty(r.context, "NativeImport", {
        value: NativeImport
      });
      Object.defineProperty(r.context, "Import", {
        value: Import
      });
      Object.defineProperty(r.context, "DynamicImport", {
        value: DynamicImport
      });
      Object.defineProperty(r.context, "URLImport", {
        value: URLImport
      });
      Object.defineProperty(r.context, "doctor", {
        value: doctorReport
      });
    });
}
