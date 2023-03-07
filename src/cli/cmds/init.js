import NativeImport from "../../imports/nativeImport.js";
import DynamicImport from "../../imports/dynamicImport.js";
import readline from "readline";
import chalk from "../../utils/chalk.js";
import { exec } from "child_process";
let pkgJson = DynamicImport(
  await import("../../../package.json", {
    assert: { type: "json" },
  })
);
let pkgJson2 = DynamicImport(
  await import("../../imports/package.json", {
    assert: { type: "json" },
  })
);
import { Import } from "../../imports/URLImport.js";
let ora = await Import("ora@6.1.2");
export default function (prog) {
  prog
    .command("init [name]")
    .describe("Initialize a new project")
    .action(async (name) => {
      let fs = await NativeImport("node:fs");
      let path = await NativeImport("node:path");
      //mkdir name
      if (fs.existsSync(path.join(process.cwd(), name))) {
        console.log(
          "%c[REEJS] %cA project with this name already exists!",
          "color: red",
          "color: yellow"
        );
        return;
      }
      //start spinner
      let spinner = ora("Initializing project...").start();
      fs.mkdirSync(path.join(process.cwd(), name));
      fs.writeFileSync(
        path.join(process.cwd(), name, ".reecfg"),
        JSON.stringify(
          {
            name: name,
            version: "0.0.1",
            features: {},
          },
          null,
          2
        )
      );
      fs.writeFileSync(
        path.join(process.cwd(), name, "package.json"),
        JSON.stringify(
          {
            name: name,
            version: "0.0.1",
            type: "module",
            main: "src/index.js",
            dependencies: {
              reejs: `^${pkgJson.version}`,
              "@reejs/imports": `^${pkgJson2.version}`,
            },
            license: "MIT",
          },
          null,
          2
        )
      );
      fs.mkdirSync(path.join(process.cwd(), name, "src", "pages", "api"), {
        recursive: true,
      });
      fs.mkdirSync(path.join(process.cwd(), name, "public"), {
        recursive: true,
      });
      fs.writeFileSync(
        path.join(process.cwd(), name, "src", "pages", "index.jsx"),
        `export default function(){
			return <h1>Hello World!</h1>
		}`
      );
      fs.mkdirSync(path.join(process.cwd(), name, "src", "components"), {
        recursive: true,
      });
      fs.mkdirSync(path.join(process.cwd(), name, "src", "styles"));
      fs.writeFileSync(
        path.join(process.cwd(), name, "src", "styles", "index.css"),
        `/* insert styles here */`
      );
      fs.writeFileSync(
        path.join(process.cwd(), name, "import_map.json"),
        JSON.stringify(
          {
            imports: {},
            browserImports: {},
          },
          null,
          2
        )
      );
      spinner.succeed("Project initialized!");
      //ask user what package manager to use
      let rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      rl.question(
        `${chalk.blue(
          "What package manager do you want to use?"
        )} ${chalk.yellow("(npm/yarn/pnpm)")} `,
        (answer) => {
          rl.close();
          //install dependencies using the package manager
          if (answer === "npm") {
            spinner = ora(
              `${chalk.hex("#805ad5")("[REEJS]")} ${chalk.yellow(
                "Installing Dependencies..."
              )}`
            ).start();
            exec(
              "npm install",
              { cwd: path.join(process.cwd(), name) },
              (err, stdout, stderr) => {
                if (err) {
                  console.log(err);
                }
                spinner.succeed(
                  `${chalk.hex("#805ad5")("[REEJS]")} ${chalk.blue(
                    "Dependencies installed!"
                  )}`
                );
                console.log(stdout);
                console.log(stderr);
              }
            );
          } else if (answer === "yarn") {
            spinner = ora(
              `${chalk.hex("#805ad5")("[REEJS]")} ${chalk.yellow(
                "Installing Dependencies..."
              )}`
            ).start();
            exec(
              "yarn install",
              { cwd: path.join(process.cwd(), name) },
              (err, stdout, stderr) => {
                if (err) {
                  console.log(err);
                }
                spinner.succeed(
                  `${chalk.hex("#805ad5")("[REEJS]")} ${chalk.blue(
                    "Dependencies installed!"
                  )}`
                );
                console.log(stdout);
                console.log(stderr);
              }
            );
          } else if (answer === "pnpm") {
            spinner = ora(
              `${chalk.hex("#805ad5")("[REEJS]")} ${chalk.yellow(
                "Installing Dependencies..."
              )}`
            ).start();
            exec(
              "pnpm install",
              { cwd: path.join(process.cwd(), name) },
              (err, stdout, stderr) => {
                if (err) {
                  console.log(err);
                }
                spinner.succeed(
                  `${chalk.hex("#805ad5")("[REEJS]")} ${chalk.blue(
                    "Dependencies installed!"
                  )}`
                );
                console.log(stdout);
                console.log(stderr);
              }
            );
          } else {
            console.log(
              "%c[REEJS] %cInvalid package manager!",
              "color: #805ad5",
              "color:red"
            );
          }
        }
      );
    });
}
