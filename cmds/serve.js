cli.command("serve")
    .describe(`Server for ree.js app`)
    .option("-p, --port <port>", "Port to listen on", "3000")
    .action(async (opts) => {
        
        if (isReejsFolder()) {
            //spawn node server
            let port = opts.port;
            let child = spawn("node", [`./index.js`, port, "--experimental-vm-modules","--experimental-fetch"], {stdio: "inherit",env: { ...process.env, NODE_OPTIONS: "--experimental-vm-modules --experimental-fetch" }, cwd: `${process.cwd()}/`, detached: false});
        }
        else {
            console.log(`Please run \`${color("reejs init", "greenBright")}\` to create a new project`);
        }
    });