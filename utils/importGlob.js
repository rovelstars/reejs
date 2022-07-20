import fs from "fs";
export async function ImportPages() {
    let files = fs.readdirSync(`${process.cwd()}/src/pages`).filter(e=>{return e.endsWith(".js") || e.endsWith(".jsx") || e.endsWith(".ts") || e.endsWith(".tsx")});
    let results = [];
    files.forEach(async file=>{
        results[file] = await import(file);
    });
    return Object.keys(results).map((route)=>{
        const path = route
        .replace(/\/src\/pages|index|\.|jsx|js$/g, '')
        .replace(/\[\.{3}.+\]/, '*')
        .replace(/\[(.+)\]/, ':$1')
    
      return { path, component: results[route] }
    });
}