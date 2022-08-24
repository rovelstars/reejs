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
                let domain;
                let name = import_map.imports[_name];
                if (name.startsWith("https://esm.sh")) domain = "esm.sh";
                else if (name.startsWith("https://esm.run")) domain = "esm.run";
                else if (name.startsWith("https://cdn.jsdelivr.net") && name.endsWith("/+esm")) {
                    name = name.replace("https://cdn.jsdelivr.net/npm/", "https://esm.run/").replace("/+esm", "");
                    domain = "esm.run";
                }
                else if (name.startsWith("https://deno.land")) domain = "deno.land";
                let importer = await import(`./urlimports/${domain}.js`);
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
        console.log("Looking for Provider for " + name);
        let domain;
        if (name.startsWith("https://esm.sh")) domain = "esm.sh";
        else if (name.startsWith("https://esm.run")) domain = "esm.run";
        else if (name.startsWith("https://cdn.jsdelivr.net") && name.endsWith("/+esm")) {
            name = name.replace("https://cdn.jsdelivr.net/npm/", "https://esm.run/").replace("/+esm", "");
            domain = "esm.run";
        }
        else if (name.startsWith("https://deno.land")) domain = "deno.land";
        if (domain) console.log("Selected: " + domain);
        let importer = await import(`./urlimports/${domain}.js`);
        await importer.default(name, null, opts.local);
    });