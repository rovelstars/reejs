cli.command("init [url] [name]")
    .describe(`Initialize a new project`)
    .action((url, name) => {
        if (!url || url == "."){
            if(fs.existsSync(".reecfg")){
                console.log(color("Project already initialized", "red"));
                return;
            }
            else{
            console.log(color("Initiating the current directory as a reejs directory.", "green"));
            fs.writeFileSync(".reecfg",
`system: react
# Can be react.
env: prod
# Can be dev / prod.
check: true
# Can be true / false. This visits all the routes and checks if they are valid.
minify: false
# Can be true / false. This minifies the assets and keeps them in memory.
twindSSR: true
# Can be true / false. This uses the twind SSR server to render the app.
allowCaching: true
# Globally enables / disables caching. This overrides the cache setting in the configs of pages.
# Disable the above to use less memory. Enable it to be more performant.
version: 0.0.1
# Do not edit this!`, "utf8");
            return;
            }
        };
        if (!url.startsWith("https://")) name = url; url = "https://github.com/ree-js/create-reeact-app";
        if (!name) name = "reejs-app";
        //check if git is installed
        exec("git --version", (err, stdout, stderr) => {
            if (err) {
                console.log(color("Git is not installed", "red"));
                return process.exit(1);
            }
            //clone the repo
            console.log(`Cloning the ${url == "https://github.com/ree-js/create-reeact-app" ? "default" : url} repo to ${color(name, "blue")}`);
            exec(`git clone ${url} ${name}`, (err) => {
                if (err) {
                    console.log(color("Error cloning the repo, maybe check whether the folder with name " + color(name, "redBright"), "red"), color("exists", "red"), color(`and repo url ${color(url, "redBright")}`, "red"), color(`is correct`, "red"));
                    return process.exit(1);
                }
                //change to the new folder
                process.chdir(name);
                //delete the .git folder
                fs.rmSync(`.git`, { recursive: true, force: true });
                fs.rmSync(`LICENSE`, { recursive: true, force: true });
                execSync("reejs i", { stdio: "inherit" });
                execSync("reejs link", { stdio: "inherit" });
                execSync("reejs map", { stdio: "inherit" });
                console.log(color(`Project ${color(name, "greenBright")} created!`, "green"));
                console.log("To get started, run the following ", "`" + color(`cd ${name} && reejs serve`, "green") + "`", " commands");
            });
        });
    });