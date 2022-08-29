if(typeof process =="undefined"){
    globalThis.process = await import("https://deno.land/std/node/process.ts");
    process = process.default;
}