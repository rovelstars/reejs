/**
 * @param {NodeModule} mod - the module to import
 * @returns {NodeModule} mod - fixed module that behaves like a static imported module
 */

export default function DynamicImport(mod) {
  try {
    let namespace = {};
    let keys = Object.keys(mod).filter((k) => k !== "default");
    if (Object.keys(mod).includes("default")) {
      namespace = mod.default;
    }
    keys.forEach((k) => {
      namespace[k] = mod[k];
    });
    namespace.default = mod.default;
    return namespace;
  } catch (e) {
    return mod;
  }
}
