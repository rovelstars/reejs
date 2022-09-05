cli.command("init [url] [name]")
    .describe(`Initialize a new project`)
    .action((url, name) => {
        if (!url || url == ".") {
            if (fs.existsSync(".reecfg")) {
                console.log(color("Project already initialized", "red"));
                return;
            }
            else {
                console.log(color("Initiating the current directory as a reejs directory.", "green"));
                fs.writeFileSync(".reecfg",
                    `system: react
# Can be react.
env: dev
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
                //create the src/pages and src/components
                fs.mkdirSync("./src/pages/api", { recursive: true });
                fs.mkdirSync("./src/components", { recursive: true });
                //create the index.js in src/pages
                fs.writeFileSync("./src/pages/index.js",
                    `export default function () {
    return ree.html\`<main className="min-h-screen bg-gradient-to-b from-red-500 to-purple-800">
    <div className="flex items-center justify-center">
      <h1 className="font-bold text-white text-7xl">
        Welcome To Ree.js!
      </h1>
    </div>
  </main>\`;
}`, "utf8");
                //create the index.js in src/pages/api
                fs.writeFileSync("./src/pages/api/index.js",
                    `export default function(req,res){
                return {hello: "world"};
            }`, "utf8");
                //create the index.js 
                fs.writeFileSync("./index.js",
                    `import ree from "reejs";
if (ree.canRun){
    let server = ree.server;
    globalThis.ree = ree.server.polyfills;
    server.listen(parseInt(process.argv[2]) || 3000);
}`, "utf8");
                fs.writeFileSync("./import-maps.json",
                    `{
                        "imports": {
                            "preact": "https://esm.sh/preact@10.10.0",
                            "react": "https://esm.sh/preact@10.10.0",
                            "htm": "https://esm.sh/htm@3.1.1",
                            "@twind/cdn": "https://esm.run/@twind/cdn@next",
                            "@twind/preset-tailwind": "https://esm.run/@twind/preset-tailwind@next"
                        }
                    }`, "utf8");
                fs.writeFileSync("./server.import-maps.json",
                    `{
                    "imports": {
                      "reejs": "./node_modules/reejs/server/index.js",
                      "twind": "https://esm.sh/twind@next",
                      "preact-ssr": "https://esm.sh/preact-render-to-string@5.2.0",
                      "h3": "https://esm.sh/h3@0.7.16?target=node",
                      "undici": "https://esm.sh/undici@5.10.0?target=node&bundle"
                    }
                  }`, "utf8");
                if (!fs.existsSync("./package.json")) {
                    console.log(color("Generating package.json", "green"));
                    fs.writeFileSync("./package.json",
                        `{
    "name": "${process.cwd().split("/").pop()}",
    "version": "1.0.0",
    "description": "An App Made With Ree.js",
    "main": "index.js",
    "type": "module",
    "scripts": {
      "start": "node index.js"
    }
}`, "utf8");
                }
                else {
                    let packageJson = JSON.parse(fs.readFileSync("./package.json", "utf8"));
                    if (packageJson.type != "module") {
                        packageJson.type = "module";
                    }
                    if (!packageJson.scripts.start) {
                        packageJson.scripts.start = "node index.js";
                    }
                    fs.writeFileSync("./package.json", JSON.stringify(packageJson, null, 2), "utf8");
                }
                execSync("reejs i", { stdio: "inherit" });
                execSync("reejs link", { stdio: "inherit" });
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
                execSync("reejs link", { stdio: "inherit" });
                console.log(color(`Project ${color(name, "greenBright")} created!`, "green"));
                console.log("To get started, run the following ", "`" + color(`cd ${name} && reejs serve`, "green") + "`", " commands");
            });
        });
    });