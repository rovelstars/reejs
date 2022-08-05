//This installs reejs toolkit to the home directory
let execApp;
if (process.versions.node && !process.versions.bun) {
  execApp = "node";
}
else if (process.bun) {
  execApp = "bun";
}
else if (typeof Deno != "undefined") {
  execApp = "deno";
}
console.log("[INFO] Using", execApp);
let path = require("path");
let fs = require("fs");
let { homedir, platform } = require("os");
let { exec, execSync } = require("child_process");

let home = homedir();
let os = platform();

let homewin;
if (os == "win32") {
  homewin = home;
  home = home.replace(/\\/g, "/");
}
if (process.env.INSTALL_TO) {
  console.log("[INFO] Installing to custom dir:", process.env.INSTALL_TO);
}
let dir = (os!="win32" && process.env.INSTALL_TO) ? process.env.INSTALL_TO: `${home}/.reejs`;

execSync("npm unlink reejs -g");

if (!fs.existsSync(dir)) {
  console.log("[INFO] Checking for git...");
  exec("git --version", (err, stdout, stderr) => {
    if (err) {
      if (os == "win32") {
        console.log(
          "[ERROR] Git not found. Please install git from https://git-scm.com/downloads"
        );
      } else if (os == "linux") {
        console.log(
          "[ERROR] Git not found. Please install git with `sudo apt-get install git`"
        );
      } else if (os == "darwin") {
        console.log(
          "[ERROR] Git not found. Please install git with `brew install git`"
        );
      } else {
        console.log("[ERROR] Git not found. Please install git cli");
      }
      console.log("[INFO] Reverting back changes...");
      process.exit(1);
    }
    console.log(`[INFO] Git found. Cloning into ${dir}`);
    exec(
      `git clone https://github.com/rovelstars/reejs.git ${os=="win32"?`${home}/.reejs`:(process.env.INSTALL_TO?process.env.INSTALL_TO: `${home}/.reejs`)}`,
      { },
      (err, stdout, stderr) => {
        if (err) {
          console.log("[ERROR] Git clone failed. Please try again");
          console.log(err);
          console.log("[INFO] Reverting back changes...");
          process.exit(1);
        }
        console.log("[INFO] Git clone successful. Installing libraries...");
        if (os != "win32") {
          console.log("[INFO] Adding ENVs to shell configs...");
          if (fs.existsSync(`${home}/.bashrc`)) {
            if (fs.readFileSync(`${home}/.bashrc`).toString().indexOf(`export NODE_OPTIONS="--experimental-vm-modules --experimental-fetch"`) == -1) {
              fs.appendFileSync(`${home}/.bashrc`, `export NODE_OPTIONS="--experimental-vm-modules --experimental-fetch"\n`);
              console.log("[INFO] Alias added to .bashrc");
            }
          }
          if (fs.existsSync(`${home}/.zshrc`)) {
            if (fs.readFileSync(`${home}/.zshrc`).toString().indexOf(`export NODE_OPTIONS="--experimental-vm-modules --experimental-fetch"`) == -1) {
              fs.appendFileSync(`${home}/.zshrc`, `export NODE_OPTIONS="--experimental-vm-modules --experimental-fetch"\n`);
              console.log("[INFO] Alias added to .zshrc");
            }
          }
        }
        exec(
          "npm link .",
          { cwd: dir + "/" },
          (err, stdout, stderr) => {
            if (err) {
              console.log(
                "[ERROR] Linking Ree.js failed. Please try again"
              );
              console.log("[INFO] Reverting back changes...");
              process.exit(1);
            }
            exec(
              `${execApp} ./failsafe.js`,
              { cwd: dir + "/" },
              (err, stdout, stderr) => {
                if (err) {
                  console.log(
                    "[ERROR] Installing dependencies failed. Please try again"
                  );
                  console.log(err);
                  console.log("[INFO] Reverting back changes...");
                  process.exit(1);
                }
                console.log(
                  "[INFO] Installing libraries successful! Cleaning up files..."
                );
                if(process.env.INSTALL_TO){
                  console.log("[WARN] Custom Installation was done. Please add the following to your .bashrc or .zshrc file:")
                  console.log(`export REEJS_CUSTOM_DIR="${process.env.INSTALL_TO}"`);
                }
                console.log(
                  "[INFO] Reejs has been installed!\nTo run reejs in the current shell, enable experimental features: `export NODE_OPTIONS=\"--experimental-vm-modules --experimental-fetch\"`\nTry it out by running `reejs init reejs-app`"
                );
              }
            );
          }
        );
      }
    );
  });
} else {
  console.log(
    "[WARN] reejs toolkit is already installed. If you want to reinstall, delete the directory at: " +
    dir
  );
}

process.on("SIGINT", function () {
  console.log("\n[INFO] Cleaning up files...");
});

process.on("SIGTERM", function () {
  console.log("\n[INFO] Cleaning up files...");
});
