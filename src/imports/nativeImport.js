import env from "./env.js";
import DynamicImport from "./dynamicImport.js";

/**
 * NativeImport is a function that returns a promise that resolves to native nodejs module
 * @async
 * @param {string} m - the module name
 * @param {boolean} isChild - used internally to determine if this function called itself, used to polyfill `process` on deno
 * @returns {Promise} Module - a promise that resolves to the native nodejs module
 */

export default async function NativeImport(m, isChild = false) {
  let mod;
  if (env === "node" || env === "bun" || env === "deno") {
    mod = DynamicImport(await import(m));
  } else {
    throw new Error("Unsupported runtime", env);
  }
  return mod;
}
