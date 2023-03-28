import DynamicImport from "../../imports/dynamicImport.js";
import NativeImport from "../../imports/nativeImport.js";
import SpecialFileImport from "../../imports/specialFileImport.js";
import {Import} from "../../imports/URLImport.js";
import copyFolderSync from "../../utils/copyFolder.js";

let fs = await NativeImport("node:fs");
let path = await NativeImport("node:path");
let terser = await Import("terser@5.16.6");
let importmap = DynamicImport(
    await import(`${process.cwd()}/import_map.json`, {assert: {type: "json"}}));
let cachemap =
    DynamicImport(await import(`${process.cwd()}/.reejs/cache/cache.json`, {
      assert: {type: "json"},
    }));

let getPackage = (pkg) => {
  let url = importmap.imports?.[pkg] || importmap.browserImports?.[pkg];
  if (!url) {
    throw new Error(`Package ${pkg} not found in import map.`);
  }
  return "./" + path.join(".reejs", "cache", cachemap[url]);
};

let pagesDir = path.join(process.cwd(), "src", "pages");
let componentsDir = path.join(process.cwd(), "src", "components");
let apisDir = path.join(pagesDir, "api");

let pages = fs.readdirSync(pagesDir).filter((file) => {
  // filter only js files that are not inside api folder
  return (!file.startsWith("api") &&
          (file.endsWith(".js") || file.endsWith(".jsx") ||
           file.endsWith(".ts") || file.endsWith(".tsx")));
});

let components = fs.readdirSync(componentsDir).filter((file) => {
  return (file.endsWith(".js") || file.endsWith(".jsx") ||
          file.endsWith(".ts") || file.endsWith(".tsx"));
});

let apis = fs.readdirSync(apisDir).filter(
    (file) => { return file.endsWith(".js") || file.endsWith(".ts"); });

export default async function(prog) {
  prog.command("packit [service]")
      .describe(
          "Pack your Reejs Project to be used in serverless and other restricted environments.")
      .action(async (service) => {
        if ([ "node", "bun", "deno-deploy", "workers", "vercel" ].indexOf(
                service) === -1) {
          console.log(
              "%c[PACKIT] %cPlease specify a valid service to pack your project for.\n%cAvailable Services are: node, bun, deno-deploy, workers, vercel.",
              "color: #ff0000", "color: #ffffff", "color: blue");
          return;
        }
        let start = Date.now();
        // transpile pages, components and apis
        let cpages = await Promise.all(pages.map(async (page) => {
          let pagePath = path.join(pagesDir, page);
          let d =
              path.join(".reejs", "serve",
                        (await SpecialFileImport(pagePath)).split("serve/")[1]);
          return [
            page.replace("index", "")
                .replace(".tsx", "")
                .replace(".      ts", "")
                .replace(".jsx", "")
                .replace(".js", ""),
            d,
          ];
        }));
        let ccomponents =
            await Promise.all(components.map(async (component) => {
              let componentPath = path.join(componentsDir, component);
              let d = path.join(
                  ".reejs", "serve",
                  (await SpecialFileImport(componentPath)).split("serve/")[1]);
              return [
                component.replace(".tsx", "")
                        .replace(".ts", "")
                        .replace(".jsx", "")
                        .replace(".js", "") +
                    ".js",
                d,
              ];
            }));
        let capis = await Promise.all(apis.map(async (api) => {
          let apiPath = path.join(apisDir, api);
          let d =
              path.join(".reejs", "serve",
                        (await SpecialFileImport(apiPath)).split("serve/")[1]);
          return [
            api.replace("index", "")
                .replace(".tsx", "")
                .replace(".ts", "")
                .replace(".jsx", "")
                .replace(".js", ""),
            d,
          ];
        }));

        let end = Date.now();

        console.log(`Transpiled ${pages.length} pages, ${
            components.length} components and ${apis.length} apis in ${
            (end - start) / 1000}s`);
        start = Date.now();
        let packitDir = path.join(process.cwd(), ".packit");
        if (fs.existsSync(packitDir)) {
          // delete the old packit folder
          fs.rmSync(packitDir, {
            recursive : true,
            force : true,
          });
        }
        fs.mkdirSync(packitDir);
        // copy the package.json, import_map.json, .reecfg, and src folder to
        // the packit folder
        fs.copyFileSync(path.join(process.cwd(), "package.json"),
                        path.join(packitDir, "package.json"));

        fs.copyFileSync(path.join(process.cwd(), "import_map.json"),
                        path.join(packitDir, "import_map.json"));
        fs.copyFileSync(path.join(process.cwd(), ".reecfg"),
                        path.join(packitDir, ".reecfg"));
        if (fs.existsSync(path.join(process.cwd(), ".tsconfig.json"))) {
          fs.copyFileSync(path.join(process.cwd(), ".tsconfig.json"),
                          path.join(packitDir, ".tsconfig.json"));
        }
        if (fs.existsSync(path.join(process.cwd(), ".env"))) {
          fs.copyFileSync(path.join(process.cwd(), ".env"),
                          path.join(packitDir, ".env"));
        }
        copyFolderSync(path.join(process.cwd(), "public"),
                       path.join(packitDir, "public"));
        copyFolderSync(path.join(process.cwd(), "node_modules"),
                       path.join(packitDir, "node_modules"));
        copyFolderSync(path.join(process.cwd(), ".reejs"),
                       path.join(packitDir, ".reejs"));

        // write random 6 digit alphanumeric string to .pack_id
        let packId = Math.random().toString(36).substring(2, 8);
        fs.writeFileSync(path.join(packitDir, ".pack_id"), packId);
        fs.writeFileSync(path.join(packitDir, "__fs.js"),
                         `let __fs = ${JSON.stringify({
                           pages : cpages,
                           components : ccomponents,
                           apis : capis,
                         })};export default __fs;`);

        fs.writeFileSync(
            path.join(packitDir, "index.js"),
            `import ReeServer from "@reejs/server";
		import { Hono } from "${getPackage("hono")}";${
                service === "node" ? `
		import { serve } from "${getPackage("@hono/node-server")}";
	    import { serveStatic } from "${getPackage("@hono/serve-static")}"`
                                   : ""}
		import render from "${getPackage("render")}";
		const server = new ReeServer(Hono, {${
                service === "node" ? "serve," : ""}});
	${
                cpages.length > 0
                    ? `
		${
                          cpages
                              .map((page) => `import file_${
                                       page[1]
                                           .split("serve/")[1]
                                           .split(".")[0]
                                           .slice(0, 6)} from "./${
                                       page[1]}";server.app.get("/${
                                       page[0]}",(c)=>c.text(render(file_${
                                       page[1]
                                           .split("serve/")[1]
                                           .split(".")[0]
                                           .slice(0, 6)})));`)
                              .join("\n")}
			`
                    : ""}
		${
                capis.length > 0
                    ? `
		${
                          capis
                              .map((api) => `import file_${
                                       api[1]
                                           .split("serve/")[1]
                                           .split(".")[0]
                                           .slice(0, 6)} from "./${
                                       api[1]}";server.app.get("/api/${
                                       api[0]}",file_${
                                       api[1]
                                           .split("serve/")[1]
                                           .split(".")[0]
                                           .slice(0, 6)});`)
                              .join("\n")}`
                    : ""}

		${
                service === "node"
                    ? "server.app.get('/__reejs/cache.json',serveStatic({path:'./.reejs/cache/cache.json'}));server.app.get('/**',serveStatic({root:'./public'}));server.listen(process.env.PORT || 3000, () => console.log(`Server started on port ${process.env.PORT || 3000}`));"
                    : ""}
	${service == "workers" ? "export default server.app;" : ""}
			`);

        end = Date.now();
        console.log(
            `Packit took ${(end - start) / 1000}s to pack your project`);
      });
}
