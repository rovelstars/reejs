//check if running on deno
let mod;
if (typeof Deno !== "undefined") {
    mod = await import("https://deno.land/std/node/https.ts");
}
else {
    //running on node
    mod = await import("https");
}

let { Agent, createServer, get, OutgoingMessage, request, Server } = mod;
mod = { Agent, createServer, get, OutgoingMessage, request, Server };
export { Agent, createServer, get, OutgoingMessage, request, Server };