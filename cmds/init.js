cli.command("init [url] [name]")
    .describe(`Initialize a new project`)
    .action((url, name) => {
        if (!url || url == ".") url = "https://github.com/ree-js/create-reeact-app";
        if(!url.startsWith("https://")) name = url; url = "https://github.com/ree-js/create-reeact-app";
        if(!name) name = "reejs-app";
        //check if git is installed
        exec("git --version", (err, stdout, stderr) => {
            if (err) {
                console.log(color("Git is not installed", "red"));
                return process.exit(1);
            }
            //clone the repo
            console.log(`Cloning the ${url == "https://github.com/ree-js/create-reeact-app" ? "default" : url} repo to ${color(name, "", "greenBg")}`);
            exec(`git clone ${url} ${name}`, (err) => {
                if (err) {
                    console.log(color("Error cloning the repo, maybe check whether the folder with name " + color(name, "", "redBg"), "red"), color("exists", "red"), color(`and repo url ${color(url, "", "redBg")}`, "red"), color(`is correct`,"red"));
                    return process.exit(1);
                }
                //change to the new folder
                process.chdir(name);
                //delete the .git folder
                fs.rmSync(`.git`, { recursive: true, force: true });
                fs.rmSync(`LICENSE`, { recursive: true, force: true });
                    console.log(color(`Project ${color(name, "", "greenBg")} created!`, "green", "greenBg"));
                    console.log("To get started, run the following ", "`" + color(`cd ${name} && reejs i && reejs link && reejs map && reejs serve`, "", "blackBrightBg") + "`", " commands");
            });
        });
    });