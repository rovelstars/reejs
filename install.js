#!/usr/bin/env node

//This installs reejs toolkit to the home directory

let path = require("path");
let fs = require("fs");
let { homedir, platform } = require("os");
let { exec } = require("child_process");

let home = homedir();
let os = platform();

let homewin;
if (os == "win32") {
  homewin = home;
  home = home.replace(/\\/g, "/");
}
let dir = `${home}/.reejs`;

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
      "git clone https://github.com/rovelstars/reejs.git .reejs",
      { cwd: home },
      (err, stdout, stderr) => {
        if (err) {
          console.log("[ERROR] Git clone failed. Please try again");
          console.log(err);
          console.log("[INFO] Reverting back changes...");
          process.exit(1);
        }
        console.log("[INFO] Git clone successful. Installing libraries...");
        if (os != "win32") {
          console.log("[INFO] Unix system detected. Making file executable.");
          exec("chmod a+x ./index.js", { cwd: dir + "/" });
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
            //make failsafe.js executable with fs
            fs.chmodSync(`${dir}/failsafe.js`, "755");
            exec(
              "node ./failsafe.js",
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
                console.log(
                  "[INFO] Reejs has been installed!\nTry it out by running `reejs init reejs-app`"
                );
                process.exit(0);
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
