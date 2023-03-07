import NativeImport from "../../imports/nativeImport.js";
import { followRedirect, URLToFile } from "../../imports/URLImportInstaller.js";
export default function add(prog) {
  prog
    .command("sync")
    .describe("Syncs your dependencies with package.json")
    .action(async () => {
      let fs = await NativeImport("node:fs");
      let path = await NativeImport("node:path");
      if (!fs.existsSync(path.join(process.cwd(), ".reecfg"))) {
        console.log(
          "%c[REEJS] %cThis is not a reejs project!",
          "color: red",
          "color: yellow"
        );
        return;
      }
      let pkgJson = JSON.parse(
        fs.readFileSync(path.join(process.cwd(), "package.json"), "utf-8")
      );
      let import_map = JSON.parse(
        fs.readFileSync(path.join(process.cwd(), "import_map.json"), "utf-8")
      );
      import_map = import_map.imports;
      let deps = pkgJson.dependencies;
      await Promise.all(
        Object.keys(import_map).map(async (key) => {
          let value = URLToFile(
            await followRedirect(import_map[key]),
            true
          ).slice(2);
          if (!fs.existsSync(path.join(process.cwd(), ".reejs", "deps", key))) {
            fs.mkdirSync(path.join(process.cwd(), ".reejs", "deps", key), {
              recursive: true,
            });
            fs.writeFileSync(
              path.join(process.cwd(), ".reejs", "deps", key, "package.json"),
              JSON.stringify(
                {
                  name: key,
                  version: "1.0.0",
                  main: "index.js",
                  type: "module",
                },
                null,
                2
              )
            );
            fs.writeFileSync(
              path.join(process.cwd(), ".reejs", "deps", key, "index.js"),
              `export * from "../../cache/${value}";export {default} from "../../cache/${value}"`
            );
          }
          deps[key] = `file:./.reejs/deps/${key}`;
        })
      );
      pkgJson.dependencies = deps;
      fs.writeFileSync(
        path.join(process.cwd(), "package.json"),
        JSON.stringify(pkgJson, null, 2)
      );
      console.log(
        "%c[REEJS] %cSynced dependencies with package.json",
        "color: #805ad5",
        "color: green"
      );
    });
}
