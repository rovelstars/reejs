cli
  .command("link")
  .describe(`Link ${color("reejs", "blueBright")} folder!`)
  .action(() => { 
    //check if node_modules is present
            if (!fs.existsSync(`${process.cwd()}/node_modules`)) {
                //create node_modules
                fs.mkdirSync(`${process.cwd()}/node_modules`);
            }
            //soft link project folder to node_modules
            if (!fs.existsSync(`${process.cwd()}/node_modules/reejs`)) {
                fs.symlinkSync(`${dir}`, `${process.cwd()}/node_modules/reejs`);
                console.log(`[REE.JS] Linked Reejs:`,dir,"to",`${process.cwd()}/node_modules/reejs`);
            }
    fs.writeFileSync(`${process.cwd()}/package.json`, JSON.stringify(pkg));
  });
