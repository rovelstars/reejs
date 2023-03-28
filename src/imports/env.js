// learn what runtime are we using based on their differences: nodejs, deno,
// bun, or else edge
let runtime = "browser";
if (typeof Deno !== "undefined") {
  runtime = "deno";
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
} else if (typeof Bun !== "undefined") {
  runtime = "bun";
}
let dirname, projectDir, reejsDir;
if (runtime == "node" || runtime == "bun") {
  dirname = new URL("..", import.meta.url).pathname.slice(0, -1);
  process.env.PWD = process.cwd();
  projectDir = dirname.slice(0, dirname.lastIndexOf("/"));
  reejsDir =
      projectDir.includes("node_modules")
          ? projectDir.slice(0, projectDir.lastIndexOf("node_modules/")) +
                "/.reejs"
          : projectDir + "/.reejs";
}
export {runtime, reejsDir, projectDir, dirname};
export default runtime;
