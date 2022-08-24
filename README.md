<div align='center'>
  <h1>Ree.js</h1>
  <h3>Make Sites Faster, without the need of building anything!</h3>
</div>

A framework boasting no-build-required features, that can be used to create websites faster, without the need of building anything.
Brings support for URL Imports and Import Maps to Nodejs! Feel free to report any bugs at the issues section or introduce new ideas in discussions!

Check up the discussions over our [Discord Server](https://discord.gg/eWbt297SkU) and let us know any suggestions if you have any!

> Install with:
Windows 10/11:
```powershell
Invoke-RestMethod https://raw.githubusercontent.com/rovelstars/reejs/master/install.js | node
```

Linux/Mac:
```sh
curl -s https://raw.githubusercontent.com/rovelstars/reejs/master/install.js | node
```

Isn't this awesome? Its definitely better than npm install!

## Nah I want to use npm install!
Alright, there you go:
```sh
npm install reejs
```

## Ree.js now supports These!

Hybrid Rendering, Terser's Minifier, URL Imports, Typescript to Javascript (Useful for deno imports), Deno Polyfills, Import Maps, Module Alias, and much more!

> We are looking for contributors and docs maintainers!

[![Contributor](https://img.shields.io/badge/Contributor-Yes-green.svg?style=flat-square)](https://dscrdly.com/server)

## What does Ree.js does in Production mode?

Disables Logging. That's it. Looks like `console.log` is too slow to be used in production.

## Alright, spare me my time; what's special about Ree.js?

- No build required
- Import Urls

> Wait, what? Import Urls?
Yes! Ree.js supports import urls, something deno has being boasting about, while nodejs doesn't support it. This spares us from having to use `npm install` to install any library. Such a lifesaver!
Example:
```js
let preact = await Import("https://esm.sh/preact");
```

And the best part? You have the same codebase being delivered to your browser, and the browser is able to use it!

### P.S. We are now shipping with REE() function that handles your errors. Because why not?