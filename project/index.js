import canRun from "./check.js";
import Import from "./import.js";
globalThis.Import = Import;
import readConfig from "./readConfig.js";
import server from "./server.js";

export default {canRun, Import, readConfig, server, IS_BROWSER: false};