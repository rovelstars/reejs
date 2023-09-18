# Installation

## System Requirements

Since Ree.js can run on multiple runtimes and packit on the most restricted edge runtimes along with normal legacy runtimes, you can run it on unrestricted, legacy runtimes too!

Tldr; just use a recent Bun/Deno/Nodejs runtime and you're good to go!

You can use any one runtime from the following three and continue from there:
- [Bun](https://bun.dev) v1.x or later
- [Deno](https://deno.land) v1.34.x or later
- [Nodejs](https://nodejs.org) v18.16.x or later

---

## Setup Reejs

### Bun

```sh
bun install reejs@latest
```

### Deno

::: info
Deno currently doesn't support node:repl module so reejs is temporarily disabled here. Currently we are looking for polyfills that we can use.
:::

```sh
deno install -A -f -n reejs npm:reejs
```

### Nodejs

```sh
npm install -g reejs
```