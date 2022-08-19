cli
  .command("link")
  .describe(`Link ${color("assets/libs", "blueBright")} folder!`)
  .action(() => {
    console.log(
      `[INFO] Linking ${color("assets/libs", "blueBright")} folder!`
    );
    let libs = fs.readdirSync(`${process.cwd()}/assets/libs`);
    //read package json
    let pkg = fs.readFileSync(`${process.cwd()}/package.json`, "utf8");
    pkg = JSON.parse(pkg);
    if(!pkg?.dependencies) pkg.dependencies = {};
    libs.forEach((lib) => {
      //make soft link to node_modules/@reejs/<lib>
      let libPath = `${process.cwd()}/assets/libs/${lib}`;
      let jsSrc = fs.readFileSync(`${libPath}/.rekt`, "utf8").split("\n");
      let scope =
        (readConfig(jsSrc, "scope") || "true") == "true" ? true : false;
      let alias = readConfig(jsSrc, "alias");
      let libLink = `${process.cwd()}/node_modules/${scope ? "@reejs/" : ""}${
        alias || lib
      }`;
      if (
        !fs.existsSync(
          `${process.cwd()}/node_modules/${scope ? "@reejs/" : ""}${
            alias || lib
          }`
        )
      ) {
        try {
          fs.mkdirSync(`${process.cwd()}/node_modules/`);
        } catch (e) {}
        try {
          fs.mkdirSync(
            `${process.cwd()}/node_modules/${scope ? "@reejs/" : ""}`
          );
        } catch (e) {}
      }
      if (!fs.existsSync(libLink)) {
        fs.symlinkSync(libPath, libLink);
        console.log(
          `[INFO] Linked ${color("`"+lib+"`", "blueBright")} -> ${color(
            scope ? "@reejs/" : "" + (alias || lib),
            "blueBright",
          )}`
        );
      } else {
        console.log(
          `[INFO] ${color(lib, "blueBright")} is already linked${
            alias ? ` (as ${alias})` : ""
          }; skipping...`
        );
      }

      //check if package.json has the lib
      if (pkg.dependencies[`${scope ? "@reejs/" : ""}${alias || lib}`]) {
        console.log(
          `[INFO] ${color(
            "`"+lib+"`",
            "blueBright",
          )} is already in package.json`
        );
      }
      //add lib to package.json
      else {
        pkg.dependencies[`${scope ? "@reejs/" : ""}${alias || lib}`] =
          "*";
        fs.writeFileSync(
          `${process.cwd()}/package.json`,
          JSON.stringify(pkg, null, 2)
        );
        console.log(
          `[INFO] Added ${color(
            lib,
            "blueBright",
          )} to package.json`
        );
      }
    });
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
