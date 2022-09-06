//check if running on deno
let mod;
if (typeof Deno !== "undefined") {
    mod = await import("https://deno.land/std/node/fs.ts");
}
else {
    //running on node
    mod = await import("fs");
}

let { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, rmdirSync, unlinkSync, statSync, watch, readdir, stat, copyFileSync, rmSync, symlinkSync } = mod;
mod = { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, rmdirSync, unlinkSync, statSync, watch, readdir, stat, copyFileSync, rmSync, symlinkSync };
export default { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, rmdirSync, unlinkSync, statSync, watch, readdir, stat, copyFileSync, rmSync, symlinkSync };