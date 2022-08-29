//check if running on deno
let mod;
if(typeof Deno !== "undefined"){
    mod = await import("https://deno.land/std/path/mod.ts");
}
else{
    //running on node
    mod = await import("path");
}
let {basename, dirname, extname, join, normalize, parse, relative, resolve, sep, delimiter} = mod;
mod = {basename, dirname, extname, join, normalize, parse, relative, resolve, sep, delimiter};
export default mod;
export {basename, dirname, extname, join, normalize, parse, relative, resolve, sep, delimiter};