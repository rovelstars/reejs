cli
  .command("feature <action> [name]")
  .describe("Manage features for Reejs Toolkit")
  .action(function (action, name) {
    if (action === "list") {
      console.log(
        "The features currently enabled are:",
        featuresList.join(", ") || color("None", "red")
      );
      let allowedFeatures = [];
      console.log(
        "The features you can currently enable:",
        allowedFeatures
          .filter(e => {
            return !featuresList.includes(e);
          })
          .join(", ")
      );
    } else if (action === "add") {
      featuresList.push(name);
      fs.writeFileSync(`${dir}/storage/features`,featuresList.join("\n"));
        if (fs.existsSync(`${dir}/features/installer/${name}.js`)) {
            let code = fs.readFileSync(`${dir}/features/installer/${name}.js`);
            eval(code);
        }
      console.log(`Feature ${name} added`);
    } else if (action === "remove") {
        featuresList = featuresList.filter(e => e !== name);
        fs.writeFileSync(`${dir}/storage/features`,featuresList.join("\n"));
        if (fs.existsSync(`${dir}/features/uninstaller/${name}.js`)) {
            let code = fs.readFileSync(`${dir}/features/uninstaller/${name}.js`);
            eval(code);
        }
        console.log(`Feature ${name} removed`);
    } else {
      cli.error("Unknown action: " + action);
    }
  });
