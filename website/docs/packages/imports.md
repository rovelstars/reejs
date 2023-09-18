# `@reejs/imports`

This package exports some helper functions that let you use URL Imports as well as normal imports in a more productive way.
Since this package doesn't depend on Packit, you can use it in any project when you don't want to use `npm` or anything similar.

This package exports the following functions:

- default: `Import` - an async function that acts like `import` in JavaScript, but it's comes included with the `default` export included alongwith other exports as opposed to the native dynamic `import` where you need to use `#default` to access the default property of the imported function.
Usage:
```js
import Import from '@reejs/imports';
let chalk = await Import("npm:chalk"); // you can use "https://esm.sh/chalk" too.
chalk.red("Hello World!");
```

- `DynamicImport` - a sync function where you can pass the native async `import`'s output to and it will return the default export of the module alongwith other exports alltogether. `Import` function uses this too under the hood.
Usage:
```js
import { DynamicImport } from '@reejs/imports';
let add = DynamicImport(await import("./library.js"));
console.log(add(1, 2));
```
Where `library.js` is:
```js
export default function add(a, b) {
    return a + b;
}
```

Note that if you don't use `DynamicImport` and use `import` directly, you will need to use `#default` to access the default export of the module.
```js
let add = (await import("./library.js")).default;
console.log(add(1, 2));
```

- `URLImport` - an async function that takes a URL and returns the default export of the module alongwith other exports alltogether. `Import` function uses this too under the hood.
Usage:
```js
import { URLImport } from '@reejs/imports';
let chalk = await URLImport("https://esm.sh/chalk");
chalk.red("Hello World!");
```

- `NativeImport` - an async function that resolves native modules like `node:fs` and `node:crypto` and returns the default export of the module alongwith other exports alltogether, this function should be preffered over the native dynamic import as it can polyfill native modules over unsupported runtimes if not availabe. `Import` function uses this too under the hood.
Usage:
```js
import { NativeImport } from '@reejs/imports';
let fs = await NativeImport("node:fs");
fs.readFileSync("package.json");
```