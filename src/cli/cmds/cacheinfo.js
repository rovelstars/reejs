import CacheMapReader from "@reejs/utils/cacheMapReader.js";
import { reejsDir } from "@reejs/imports/env.js";
export default async function (prog, opts) {
  prog
    .command("cache-info [name]")
    .describe(
      "Tells you the original file URL of the cached file name you provide"
    )
    .action(async function (name) {
      let reader1 = new CacheMapReader(reejsDir);
      if (!name) {
        console.log("Please provide a file name to get the original URL");
        return;
      }
      let map1 = reader1.read();
      //find the key in the map whose value is the name
      let result =
        Object.keys(map1)
          .find(key => (map1[key] === name.includes(".") ? name : name + ".js"))
          .replace("|", " [") + "]";
      if (result) {
        // console.log(`Original URL for ${name} is ${result}, found in ${reader1.url()}`);
        console.log(
          `%c[CACHE] %cOriginal URL: %c${result}\n%c[INFO] %cFound in: %c${reader1.url()}`,
          "color: green",
          "",
          "color: #f59e0b; font-weight: bold",
          "color: #f59e0b",
          "",
          "color: #f59e0b; font-weight: bold"
        );
      } else {
        let reader2 = new CacheMapReader(
          globalThis?.process?.cwd?.() || Deno.cwd()
        );
        let map2 = reader2.read();
        let result =
          Object.keys(map2)
            .find(key =>
              map2[key] === name.includes(".") ? name : name + ".js"
            )
            .replace("|", " [") + "]";
        if (result) {
          console.log(
            `%c[CACHE] %cOriginal URL: %c${result}\n%c[INFO] %cFound in: %c${reader2.url()}`,
            "color: green",
            "",
            "color: #f59e0b; font-weight: bold",
            "color: #f59e0b",
            "",
            "color: #f59e0b; font-weight: bold"
          );
        } else {
          console.log(
            `File ${name} not found in cache. Please run this command in the project directory where the file is located.`
          );
        }
      }
    });
}
