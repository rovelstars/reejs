<div align='center'>
  <h1>Ree.js</h1>
  <h3>Make Sites Faster, without the need of building anything!</h3>
</div>

A framework boasting no-build-required features, that can be used to create websites faster, without the need of building anything.
Brings support for URL Imports and Import Maps to Nodejs! Includes its own very dedicated package manager. Feel free to report any bugs at the issues section or introduce new ideas in discussions!

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

> Note:
We have `reejs link` command that can be used to link all the libraries that have been installed in the project with `reejs install` to the node_modules folder. This is useful if you want to use any dependency with nodejs' ESM syntax, since alternatives to them were:
- Custom Module Loader (Its currently experimental by nodejs v18)
- Import Maps (Deno has it, Nodejs doesn't; GG! *sarcastically of course*)
- Module Alias npm package (Not really supported with ESM syntax, bye bye hacking require module loaders)

You can generate import maps with `reejs map`

Any library that's linked via above command will be installed into `@reejs` directory of node_modules, so you can import with `@reejs/<library>` syntax.
Don't worry! Both `@reejs` & `reejs` scope/package has been locked to prevent any conflicts with other libraries! (Including hackers from introducing other packages with the same name!)
Packages can be unscoped if their config file has `scope: libraryName`. This will link them to `libraryName`.

## Ree.js now supports These!

Hybrid Rendering, Terser's Minifier, URL Imports, Typescript to Javascript (Useful for deno imports), Deno Polyfills, Import Maps, Module Alias, and much more!

> We are looking for contributors and docs maintainers!

[![Contributor](https://img.shields.io/badge/Contributor-Yes-green.svg?style=flat-square)](https://dscrdly.com/server)

## What does Ree.js does in Production mode?

Disables Logging. That's it. Looks like `console.log` is too slow to be used in production.

## What's up with `.rekt` file?

These are module configs that are used to download the required files, and respectively generate and link to import maps and node modules respectively.
If you know yaml, you know rekt. However it's a smaller and trimmed down version of the yaml spec, that not fully supports the spec, most of them being all those multiline values.
Example of a rekt file:

```yaml
url: https://cdn.jsdelivr.net/npm/twind@0.16.17/twind.js
version: 0.16.17
type: module
more: ["https://cdn.jsdelivr.net/npm/twind@0.16.17/shim/shim.js" | "https://cdn.jsdelivr.net/npm/twind@0.16.17/observe/observe.js"]
more_as: [ "shim/shim.js" | "observe/observe.js"]
# double quotes are allowed in rekt files, as well as unquoted values. Double quotes are useful if you want strings that start or end with spaces, that otherwise would have been trimmed away by our parser.
more_alias: [ "shim/shim.js" | "observe"]
# more alias is for import mapping purposes, more_as is for node module linking.
```

### P.S. We are now shipping with REE() function that handles your errors. Because why not?