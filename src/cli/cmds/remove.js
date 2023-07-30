import dl from "@reejs/imports/URLImportInstaller.js";
import fs from "node:fs";
import path from "node:path";
export default function add(prog) {
  prog
    .command("remove [name]")
    .alias(["uninstall", "rm"])
    .describe("Removes a package to your project")
    .action(async (name) => {
      if (!fs.existsSync(path.join(process.cwd(), "reecfg.json"))) {
        console.log(
          "%c[REEJS] %cThis is not a reejs project!",
          "color: red",
          "color: yellow"
        );
        return;
      }
      if (!name) {
        console.log(
          "%c[DOWNLOAD] %cPlease specify a package to remove",
          "color:orange",
          "color:yellow"
        );
        return;
      }
      if (!name.startsWith("https://") && !name.startsWith("http://")) {
        name = "https://esm.sh/" + name;
        await dl(name, true, true);
      } else {
        await dl(name, true, true);
      }
      console.log(
        "%c[DOWNLOAD] %cRemoved " + name,
        "color:green",
        "color:red;font-weight:bold;"
      );
    });
}
