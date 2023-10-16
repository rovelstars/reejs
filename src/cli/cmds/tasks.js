import { NativeImport } from "@reejs/imports/index.js";

export default async function (prog) {
  prog
    .command("task [task] [...args]")
    .describe("Run a pre-defined task from `reecfg.json` and `package.json`")
    .action(async function (task) {
      let fs = await NativeImport("node:fs/promises");
      let path = await NativeImport("node:path");
      let spawn = (await NativeImport("node:child_process")).spawn;

      let reecfg = {};
      try {
        reecfg = await fs.readFile(
          path.join(process.cwd(), "reecfg.json"),
          "utf-8"
        );
        reecfg = JSON.parse(reecfg);
      } catch (e) {}
      let pkgjson = await fs.readFile(
        path.join(process.cwd(), "package.json"),
        "utf-8"
      );
      pkgjson = JSON.parse(pkgjson);

      let tasks = Object.keys(reecfg.tasks || {});
      tasks = tasks.concat(Object.keys(pkgjson.scripts));
      if (!task) {
        console.log(
          "%c[REEJS] %cAvailable tasks: ",
          "color: #805ad5",
          "color: green"
        );
        tasks.forEach(task => {
          console.log(
            `%c- %c${task} %c${pkgjson.scripts[task] ? "(package.json)" : ""}`,
            "color: gray",
            "color: blue",
            "color: gray; font-style: italic"
          );
          //show the command
          let taskCmd = reecfg.tasks?.[task] || pkgjson.scripts?.[task];
          console.log(`    ${taskCmd}`);
        });
        return;
      }
      if (!tasks.includes(task)) {
        console.log(
          "%c[REEJS] %cTask not found!",
          "color: #805ad5",
          "color: red"
        );
        return;
      }
      let taskCmds = reecfg.tasks?.[task] || pkgjson.scripts?.[task];
      //taskCmds have && in it. So we need to split it and run each command separately
      taskCmds = taskCmds.split("&&");
      let pwd = process.cwd();
      //we need to keep account of the current working directory because the task commands might change it
      taskCmds.forEach(async taskCmd => {
        taskCmd = taskCmd.trim();
        let cmd = taskCmd.split(" ")[0];
        let args = taskCmd.split(" ").slice(1);
        //if the command is cd, we need to change the current working directory
        if (cmd === "cd") {
          let dir = args[0];
          if (dir === "~") {
            dir = process.env.HOME;
          } else {
            dir = path.join(pwd, dir);
          }
        }
        //concate the args with the args from the command line
        args = args.concat(process.argv.slice(4));
        console.log(
          "%c[REEJS] %cTask: %c" + task + " %c" + cmd + " " + args.join(" "),
          "color: #805ad5",
          "color: green",
          "color: blue",
          ""
        );
        let child = spawn(cmd, args, { stdio: "inherit", cwd: pwd });
        child.on("exit", code => {
          process.exit(code);
        });
      });
    });
}
