cli.command("version [number]")
.describe("Change the version of the toolkit from Github")
.action((number)=>{
    if(!number) number = "-";
    exec(number=="-"?"cd ~/.reejs && git switch - && node ./failsafe.js":`cd ~/.reejs && git checkout ${number} && node ./failsafe.js`,(err, stdout, stderr)=>{
        if(err){
            console.log("[ERROR] Failed to change version. Please check whether the version you provided is correct.",err);
        }
        else{
            console.log(`[INFO] Version changed to ${number=="-"? "master": number}`);
        }
    });
});