cli
  .command("map")
  .describe("Generate Import Maps based on libraries installed")
  .action(() => {
    //check if file import-maps.json exists
    if (!fs.existsSync(`${process.cwd()}/import-maps.json`)) {
      //create file
      fs.writeFileSync(`${process.cwd()}/import-maps.json`, "{}");
      console.log("[INFO] Intialized import-maps.json");
    }
    let imports = {};
    //read assets/libs
    let libs = fs.readdirSync(`${process.cwd()}/assets/libs`);

    libs.forEach((lib) => {
      //read .rekt file
      let jsSrc = fs
        .readFileSync(`${process.cwd()}/assets/libs/${lib}/.rekt`, "utf8")
        .split("\n");
      let alias = readConfig(jsSrc, "alias") || lib;
      let _as = readConfig(jsSrc, "as") || "index.js";
      let url = `/assets/libs/${lib}/${_as ? _as : "index.js"}`;
        //add to imports
        imports[alias] = url;
      let more = readConfig(jsSrc, "more");
      if (more) {
        let more_as = readConfig(jsSrc, "more_as");
        let more_alias = readConfig(jsSrc, "more_alias") || [];
        more.forEach((m,i) => {
          imports[`${alias}/${more_alias[i] || more_as[i]}`] = `/assets/libs/${lib}/${more_as[i]}`;
        });
      }
    });
    //write to import-maps.json
    fs.writeFileSync(`${process.cwd()}/import-maps.json`, JSON.stringify({imports}));
    console.log("[INFO] Generated import-maps.json");
  });
