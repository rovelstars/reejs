//check if running on deno
let mod;
if(typeof Deno !== "undefined"){
    mod = await import("https://deno.land/std/node/child_process.ts");
}
else{
    //running on node
    mod = await import("child_process");
}
let {exec, execSync, spawn, spawnSync} = mod;
mod = {exec, execSync, spawn, spawnSync};
export default mod;
export {exec, execSync, spawn, spawnSync};