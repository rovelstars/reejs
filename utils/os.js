//check if running on deno
let mod;
if (typeof Deno !== "undefined") {
    mod = await import("https://deno.land/std/node/os.ts");
}
else {
    //running on node
    mod = await import("os");
}

let { arch, homedir, hostname, platform, type } = mod;
mod = { arch, homedir, hostname, platform, type };
export { arch, homedir, hostname, platform, type };