//check if running on deno
let mod;
if(typeof Deno !== "undefined"){
    mod = await import("https://deno.land/std/node/url.ts");
}
else{
    //running on node
    mod = await import("url");
}
export default mod;
export let {fileURLToPath} = mod;