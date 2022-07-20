cli
  .command("link")
  .describe(`Link ${color("assets/libs", "", "blueBrightBg")} folder!`)
  .action(() => {
    console.log(
      `[INFO] Linking ${color("assets/libs", "", "blueBrightBg")} folder!`
    );
    let libs = fs.readdirSync(`${process.cwd()}/assets/libs`);
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
          `[INFO] Linked ${color(lib, "", "blueBrightBg")} -> ${color(
            scope ? "@reejs/" : "" + (alias || lib),
            "",
            "blueBrightBg"
          )}`
        );
      } else {
        console.log(
          `[INFO] ${color(lib, "", "blueBrightBg")} is already linked${
            alias ? ` (as ${alias})` : ""
          }; skipping...`
        );
      }
    });
  });
