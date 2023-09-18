# `reejs x`

`reejs x` is a command line tool that allows you to run files available locally, or from the internet.
You can run most of the Deno examples, local scripts and even scripts from the internet.

Example:
```sh
reejs x https://examples.deno.land/color-logging.ts
```

This is used by online services like [esm.sh](https://esm.sh/#cli:~:text=The%20CLI%20script%20works%20with%20Node/Bun%20via%20Reejs%3A) to distribute their CLIs configured to make use of URL Imports and other Deno features.

Example from esm.sh:
```sh
# Initializing
reejs x https://esm.sh init
# Using reejs tasks
reejs task esm:add    react
reejs task esm:update react
reejs task esm:remove react
```

This CLI is their Deno CLI alternative which manages packages in import maps, but made sure to work with Reejs.

---

You can run files locally too, or even use Reejs as the runtime instead of Nodejs or Deno!

`index.ts` file:
```ts
let name: string = "Ren";
console.log("Hello World!", name);
```

```sh
reejs x index.ts
# Hello World! Ren
```

You can run special CLIs and scripts like [Ranimax](https://github.com/renhiyama/ranimax) (Anime Downloader CLI, made for testing):

```sh
reejs x https://raw.githubusercontent.com/renhiyama/ranimax/main/index.js
```