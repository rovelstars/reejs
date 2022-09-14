import canRun from "./check.js";
let server, components, Import;
if (canRun) {
    Import = await import("./import.js");
    globalThis.Import = Import;
    server = await import("./server.js");
    server = server.default;
    server.polyfills.components = await import("./components/index.js");
}
import readConfig from "./readConfig.js";

export default {canRun, Import, readConfig, server, IS_BROWSER: false};