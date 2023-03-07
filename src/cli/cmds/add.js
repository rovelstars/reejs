import dl from "../../imports/URLImportInstaller.js";
import fs from "node:fs";
import path from "node:path";
export default function add(prog) {
  prog
    .command("add [name] [url]")
    .alias(["install", "i"])
    .option("-f, --force", "Install default URLs")
    .option("-b, --browser", "Install as browser dependency")
    .describe("Add a package to your project")
    .action(async (name, url, opts) => {
      if (!fs.existsSync(path.join(process.cwd(), ".reecfg"))) {
        console.log(
          "%c[REEJS] %cThis is not a reejs project!",
          "color: red",
          "color: yellow"
        );
        return;
      }
      if (!name) {
        console.log(
          "%c[DOWNLOAD] %cInstalling all packages mentioned in import_map.json ...",
          "color: #805ad5",
          "color: yellow"
        );
        let import_map = JSON.parse(
          fs.readFileSync(path.join(process.cwd(), "import_map.json"))
        );
        for (let key in import_map.imports) {
          await dl(import_map.imports[key], true);
        }
        console.log(
          "%c[DOWNLOAD] %cInstalled all packages!",
          "color: green",
          "color: blue"
        );
        return;
      }
      if (!url) {
        let isBrowser = opts.browser || opts.b ? "browserImports" : "imports";
        if (fs.existsSync(path.join(process.cwd(), "import_map.json"))) {
          let import_map = JSON.parse(
            fs.readFileSync(path.join(process.cwd(), "import_map.json"))
          );
          if (import_map[isBrowser][name]) {
            url = import_map[isBrowser][name];
          } else {
            if (!opts.force && !opts.f) {
              console.log(
                "%c[REEJS] %cPackage not found in import_map.json",
                "color: red",
                "color: yellow"
              );
              console.log(
                "%c[REEJS] %cPlease specify a url alongwith name to add it. Use %c`--force`%c to use default esm.sh with nodejs/browser (based on your args) target & bundled version.",
                "color: red",
                "color: white",
                "color: blue;",
                "color:white"
              );
              return;
            } else {
              console.log("Generating default URL...");
              url = `https://esm.sh/${name}${
                isBrowser === "browserImports"
                  ? "?target=browser"
                  : "?target=node"
              }&bundle`;
              console.log(url);
            }
          }
          await dl(url, true);
          //add to import_map.json
          import_map[isBrowser][name] = url;
          fs.writeFileSync(
            path.join(process.cwd(), "import_map.json"),
            JSON.stringify(import_map, null, 2)
          );
        }
      } else {
        await dl(url, true);
        //add to import_map.json
        let import_map = fs.readFileSync(
          path.join(process.cwd(), "import_map.json")
        );
        import_map[isBrowser][name] = url;
        fs.writeFileSync(
          path.join(process.cwd(), "import_map.json"),
          JSON.stringify(import_map, null, 2)
        );
      }
      console.log(
        "%c[DOWNLOAD] %cInstalled " + name,
        "color:green",
        "color:blue;font-weight:bold;"
      );
    });
}
