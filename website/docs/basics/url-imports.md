# URL Imports

URL Imports are a way to import a file from a url. This is useful for importing dependencies from a CDN or from a remote server.

```js
// Importing a file from a url
import {
  add,
  multiply,
} from "https://x.nest.land/ramda@0.27.0/source/index.js";

function totalCost(outbound: number, inbound: number, tax: number): number {
  return multiply(add(outbound, inbound), tax);
}

console.log(totalCost(19, 31, 1.2));
console.log(totalCost(45, 27, 1.15));

/**
 * Output
 *
 * 60
 * 82.8
 */
```

You can import typescript or jsx files right from via URL Imports. This allows you to directly use [deno.land/x](https://deno.land/x) or [nest.land](https://nest.land) to import dependencies.
As long as Reejs has the necessary Deno polyfills for any Deno specific APIs used in the imported file, it will work.

Incase you were wondering about Deno permissions, Reejs will automatically grant all permissions to any file imported via URL Imports.

```js
// Importing a file from a url
import * as denoGraph from "https://deno.land/x/deno_graph@0.49.0/mod.ts";

const graph = await denoGraph.createGraph("https://esm.sh/react");
console.log(graph); //just works :)
```

### Shouldn't it be tiresome to type out the whole url everytime?

Well... Maybe? That's why we support import maps. Also you could use `deps.{js/ts}` file from where you can declare all your depedencies and import from there, as Deno suggests.
You can read more about `deps.{js/ts}` [here](https://deno.com/manual@v1.34.3/basics/modules#it-seems-unwieldy-to-import-urls-everywhere).