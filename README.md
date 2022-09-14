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

Hybrid Rendering, Terser's Minifier, URL Imports, JSX, Typescript to Javascript (Useful for deno imports), Deno Polyfills, Import Maps, Module Alias, and much more!

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

# What about Optimizations? Why should I use Reejs which doesn't even have a build system?
We heard you, and you need to hear us:
> Next.js

![](https://ren.reeee.ee/5Hw6_S950.png)

> Ree.js

![](https://images-ext-2.discordapp.net/external/u0qLvfWMcFE4aa9wzJID6AVDNjaUBU_ZRueC0OYTiiU/https/ren.reeee.ee/ogp/5HwgtOBjp.png)

This above is a screenshot of the performance of Ree.js, and the performance of Next.js. As you can see, Ree.js is faster than Next.js, and it doesn't even have a build system! This is because of the optimizations we have made to Ree.js, and the optimizations we are planning to make in the future.
This is was ran on our https://github.com/rovelstars/rdl 's frontend folder, which uses Next.js
FYI: the frontend project is not the highest quality website available, and it uses 2 fonts that are large enough in size + a HD background image as shown below + our logo in Navbar.

I had to make the code compatible with Ree.js before continuing.

## Lighthouse Score

> Ree.js

![](https://images-ext-1.discordapp.net/external/EP-3miP82b7yobr7OSu8-rEU_q3aI-bnsoQgfXz8hy8/https/ren.reeee.ee/ogp/5Hw5oXMNL.png?width=1200&height=489)

> Next.js

![](https://images-ext-1.discordapp.net/external/pgd7Pa8shHBaMG-K5zyWo0HkFBOL6O-deYhDfypk5QA/https/ren.reeee.ee/ogp/5Hw6DYAda.png?width=1200&height=496)

Next is upto you on which next framework you choose!