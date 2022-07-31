import isEnabled from "./check.js";
import Import from "./import.js";
globalThis.Import = Import;
import readConfig from "./readConfig.js";
import server from "./server.js";

export default {isEnabled, Import, readConfig, server, IS_BROWSER: false};