cli.command("pack-it")
    .describe(`Pack your project for serverless deployment!`)
    .option("-o, --output <output>", "The output file name")
    .action(() => {
        if (process.env.CF_PAGES) console.log("Packing Your Project for Cloudflare Pages...");
        if (!fs.existsSync(`${process.cwd()}/.packit`)) {
            fs.mkdirSync(`${process.cwd()}/.packit`, { recursive: true });
        }
        
    })