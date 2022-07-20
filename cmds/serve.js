cli.command("serve")
    .describe(`Server for ree.js app`)
    .option("-p, --port <port>", "Port to listen on", "3000")
    .action(async (opts) => {
        
        if (isReejsFolder()) {
            let reecfg = fs.readFileSync(path.join(process.cwd(), ".reecfg"), "utf8").split("\n");
            let rexMode = readConfig(reecfg, "rex")=="true";
            if(rexMode) console.log(color("REX mode enabled!", "red"));
            if(!fs.existsSync(`${process.cwd()}/import-maps.json`)){
                console.log(color("[WARN] Import Maps was not found. Libraries won't be linked!", "red"));
            }
            if(readConfig(reecfg,"env")=="dev"){
                console.log(color("Ree.js is running in development mode!\nWatching for file changes!", "green"));
                //use fs.watch to watch for changes in the cmds/server/index.js file
                //spawn a process
                let child = spawn("node", [path.join(__dirname, "cmds", "server", "index.js")], {
                    stdio: "inherit",
                    detached: false
                });
                let reload = () => {
                    child.kill();
                    console.log(color("[INFO] Killed Old server...", "yellow"));
                    child = spawn("node", [path.join(__dirname, "cmds", "server", "index.js")], {
                        stdio: "inherit",
                        detached: false
                    });
                };
                let wait=false;
                fs.watch(`${process.cwd()}/`,async(event, filename) => {
                    if(event=="change" && !wait){
                    reload();
                    wait=true;
                    setTimeout(()=>{wait=false},3000);
                    }
                });
                process.on("SIGINT", () => {
                    //kill child
                    child.kill();
                    console.log(color("[INFO] Killed Old server...", "yellow"));
                    process.exit(0);
                });
            }
            else{
                //spawn a new process to run the server
                console.log(color("Ree.js is running in production mode!\nSpawning a new process to run the server...", "green"));
                let child = spawn("node", [path.join(__dirname, "cmds", "server", "index.js")], {
                    stdio: "inherit",
                    detached: false
                });
            }
        }
        else {
            console.log(`Please run \`${color("reejs init", "", "blackBrightBg")}\` to create a new project`);
        }
    });