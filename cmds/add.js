cli.command("add [name]")
    .describe(`Install a new package`)
    .action(async (name) => {
        if (!name) {
            let import_map = fs.existsSync(`${process.cwd()}/import-maps.json`) ?
                JSON.parse(fs.readFileSync(`${process.cwd()}/import-maps.json`, "utf8")) :
                { imports: {} };
            let keys = Object.keys(import_map.imports);
            console.log(`Installing ${keys.length} packages from import-maps.json`);
            keys.forEach(async _name => {
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
                await importer.default(name);
            });
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
        await importer.default(name);
    });