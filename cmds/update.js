cli
  .command("update")
  .describe(`Update your toolkit`)
  .action(() => {
    console.log(color("Updating Ree.js Toolkit...", "green"));
    fs.rmSync(dir, { recursive: true, force: true });
    console.log(
      color("Downloading Required Files, Please don't exit!", "", "redBg")
    );
    if (os == "win32")
      exec("powershell.exe Invoke-RestMethod https://pastebin.com/raw/PdLBGtkb | node");
    else exec("curl -s https://pastebin.com/raw/PdLBGtkb | node");
  });
