cli.command("add [name]")
    .alias(["install", "i"])
    .describe(`Install a new package`)
    .option("--local", "Install locally")
    .action(async (name, opts) => {
        if (opts.local) {
            console.log("Installing locally");
            if (!fs.existsSync(".cache")) {
                fs.mkdirSync(".cache");
            }
        }
        if (!name) {
            let pkg = fs.existsSync(`${process.cwd()}/package.json`) ?
                JSON.parse(fs.readFileSync(`${process.cwd()}/package.json`)) :
                {};
            if (!pkg.dependencies) pkg.dependencies = {};
            let import_map = fs.existsSync(`${process.cwd()}/import-maps.json`) ?
                JSON.parse(fs.readFileSync(`${process.cwd()}/import-maps.json`, "utf8")) :
                { imports: {} };
            let keys = Object.keys(import_map.imports);
            console.log(`Installing ${keys.length} packages from import-maps.json`);
            await Promise.all(keys.map(async (_name) => {
                let name = import_map.imports[_name];
                let importer = await import("./utils/urlimports.js");
                let dir = await importer.default(name, null, opts.local);
                pkg.dependencies[_name] = "file:" + (opts.local ?
                    "./.cache/storage/local" + dir.split("/.cache/storage/local")[1]
                    : dir.split("/").slice(0, -1).join("/"));
                if (!fs.existsSync(`${process.cwd()}/node_modules/${_name}`))
                    fs.mkdirSync(`${process.cwd()}/node_modules/${_name}`, { recursive: true });
                spawn("ln", ["-s", dir, `${process.cwd()}/node_modules/${_name}/index.js`]);
                fs.writeFileSync(`${dir.split("/").slice(0, -1).join("/")}/package.json`, JSON.stringify({
                    main: dir.split("/")[dir.split("/").length - 1],
                    name: _name,
                    type: "module"
                }));
            }));
            if (!pkg.dependencies["reejs"]) pkg.dependencies["reejs"] = `file:${dir}`;
            fs.writeFileSync(`${process.cwd()}/package.json`, JSON.stringify(pkg, null, 4));
            return;
        }
        if(name){
        let importer = await import("./utils/urlimports.js");
        await importer.default(name, null, opts.local);
    }
    });