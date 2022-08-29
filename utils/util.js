//check if running on deno
let mod;
if (typeof Deno !== "undefined") {
    mod = await import("https://deno.land/std/node/util.ts");
}
else {
    //running on node
    mod = await import("util");
}

let {promisify} = mod;
mod = {promisify};
export {promisify};