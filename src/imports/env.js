// learn what runtime are we using based on their differences: nodejs, deno,
// bun, or else edge
let runtime = "browser";
if (typeof Deno !== "undefined" && (globalThis?.process?.argv[0]?.includes("deno"))){
  runtime = "deno";
} else if (typeof Bun !== "undefined") {
  runtime = "bun";
} else if (typeof process !== "undefined") {
  if (process.versions.node) {
    runtime = "node";
    const originalEmit = process.emit;
    process.emit = function(name, data, ...args) {
      if (name === `warning` && typeof data === `object` &&
          data.name === `ExperimentalWarning`)
        return false;

      return originalEmit.apply(process, arguments);
    };
  }
}
//create path.join polyfill for all runtimes

function joinPath() {
  var paths = Array.prototype.slice.call(arguments);
  return paths.join('/').replace(/\/+/g, '/');
}


let dirname, projectDir, reejsDir;
if (runtime == "node" || runtime == "bun" || runtime == "deno") {
  dirname = new URL("..", import.meta.url).pathname.slice(0, -1);
  if(new URL("..", import.meta.url).protocol!="file:"){
    dirname = globalThis?.Deno?.env?.get('DENO_INSTALL') || "/tmp"
      }
  if(globalThis?.process)process.env.PWD = process.cwd();
  if(globalThis?.Deno) Deno.env.set("PWD", Deno.cwd());
  projectDir = dirname.slice(0, dirname.lastIndexOf("/"));
  reejsDir =
      projectDir.includes("node_modules")
          ? joinPath(projectDir.slice(0, projectDir.lastIndexOf("node_modules")),
                ".reejs")
          : joinPath(projectDir, ".reejs");
}
export {runtime, reejsDir, projectDir, dirname};
export default runtime;
