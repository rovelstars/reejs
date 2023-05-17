import repl, { REPLServer } from 'repl';
import Import, { NativeImport, DynamicImport,URLImport } from "../../imports/index.js";
import dl from '../../imports/URLImportInstaller.js';
import doctor from "./doctor.js";
export default async function (prog) {
  prog
    .command("repl")
    .describe("Start a quick repl to test out reejs")
    .action(async function () {
      let r = repl.start("> ");
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
        value: doctor
      });
    });
}
