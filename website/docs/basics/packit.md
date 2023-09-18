# Packit

> Ah yes, here we a**ree**... A truly te**ree**fying fast transpiler and plugin manager that powers Reejs! ⚡⚡⚡

Reejs uses it's own in-house file generator (you might call it file-to-file transpiler) that has a plugin system.
Packit generally enables your code to use URL Imports directly without setting up `import_map.json` (but reejs still needs import maps for your projects).
Alongwith that, it allows transpiling different file extensions like `.jsx` or `.ts` files to js.

### Fun Fact:

Packit comes with all the goodies you will always expect to be available in a code bundler like vite or swc. These includes, but not limited to:
- plugins
- file watching
- caching
- able to monkey-patch the default builtin plugins to suit your needs

Packit is generally divided into four parts:

- Readers
- Transpilers
- Writers
- Copiers

Packit generates a `packit/index.js` file in your project that is usually the entry point for the available services.

---

## Using Packit

As stated in the Commands section, you may use `reejs packit <service> [options]` where the service must be one of the following:

- `node`
- `deno` (under the hood it is replaced with `deno-deploy`)
- `deno-deploy`
- `bun`
- `static`
- `vercel`
- `edge`

By default, Packit packs your project as a production "build".
You may use `--dev` or `-d` flag to start a development server. For supported services, Packit will automatically run the appropriate command to start a development server as a child process.

::: warning
We don't build your code, but since you know that "build" generally means building your code, we mean the final output of your code and not the "build process". Throughout the documentation, we'll refer to the final output of your code as "build", and Packit "packs" your code.
:::

---

## Configuration

When generating a new Reejs project, `packit.config.js` file will be already created at the root of the project.
You may add Packit-compatible plugins via this config file.

Here's a sample `packit.config.js` file:

```js
export default {
  readers: [],
  transpilers: [],
  writers: [],
  copyToPackit: []
}
```

---

### Readers

A Reader returns back which files must be used in the project. It must export the following object:

```js
{
  name: "example",
  run: ()=>{
    return ["src/example.js"] // return an array of files
  }, //a function that returns an array of files, if undefined, Packit will look for `pattern` property

  pattern: "src/*.js" // a glob pattern to match files
  exclude: ["src/example.js"] // an array of files to exclude. Is optional even when you use `pattern` property
}
```

By default, Reejs has three Readers:

- pages
- components
- apis

To override any of the inbuilt Reader(s), just export a new Reader in your config file with the same name (case-sensitive) and you're good to go!

---

### Transpilers

A Transpiler will transpile the file for the extension it is configured for. It must export the following object:

```js
{
  name: "js",
  run: (fileURL, service)=>{
    return fileURL; // return the fileURL of transpiled/built file.
    //by default, Reejs saves files in `.reejs/serve/<shasum of fileURL>.js` format. we recommend you to do the same.
    //you can make use of `service` argument to check which service is packit running for. Take a look at the `Using Packit` section for more info.
  }
}
```

[Writers](#writers) will be ask configured Transpiler to transpile the mentioned file, instead of transpiling the whole directory.
That's just one of the **ree**asons why Packit is so fast!

So for the following **ree**ason, we expect the Transpiler to walk through the code provided to it, look for imports, and recursively transpile them too.
Packit, or more specifically the Writer expects you to do so.

::: tip
Make sure to use `@reejs/imports/specialFileImport.js` module if you want to enable URL Imports. This package is used under the hood for the following default Transpilers given below.
:::

By default, Reejs has Transpilers set for the following file extensions:

- js
- jsx
- ts
- tsx
- mdx
- md

To override any of the inbuilt Transpiler(s), just export a new Transpiler in your config file with the same name (case-sensitive) and you're good to go!

---

### Writers

A Writer will append text (code) to the end of the `packit/index.js` in your project alongside that, it
will modify available `DATA` property, add/removing/modifying variables that it has processed and provide it to the next Writer(s).

Unlike Readers & Transpilers, Writers are processed serially (without using `await Promise.all()`), in order to make sure that the code is appended in the correct order, and the necessary `DATA` property is available to the next Writer(s).

---

### copyToPackit

A Copier will copy the file to the `packit` directory in your project.
By default, Packit copies:
- node_modules
- package.json
- import_map.json
- tailwind.config.js
- twind.config.js
- .reecfg

It must export the following sample function:

::: tip
Although you can consume the `isDevMode` argument in your function, copiers are only ran during build mode, and not in dev mode.
:::

```js
(service, isDevMode, glob)=>{
    // isDevMode will always be false as copiers are only ran during build mode
    // glob is the package exported from `npm:glob@10.2.7`
    // you must return back an array of files and folders to copy to the `packit` directory
    let files = glob.sync("example/**/*");
    let folders = glob.sync("more_codes/**/*", { onlyDirectories: true });
    return { files, folders };
  }
```

---

If you have made this far, you're ready to create your own Packit-compatible plugin!

## Packit plugins

Packit plugins are generally npm packages that are published to npm registry. We decided to keep our api similar to vite and unplugin, so that you can easily port your plugins to Reejs.

We tried some of the plugins from vite and unplugin, and they worked flawlessly with Reejs! 🎉
Some of them needed a little bit of tweaking, but they worked!
Here are some of the plugins that we tried and they worked:
- [millionjs](https://github.com/aidenybai/million/)
- [unplugin-auto-import](https://github.com/unplugin/unplugin-auto-import)

There might be a chance that popular plugins not made for reejs might work, as long as they don't depend on any internal API or are specifically made for a specific bundler.
Your best bet is to try their `unimport` or `vite` versions of those plugins.

Example config for `unimport`:

```js
import AutoImport from 'unplugin-auto-import';

export default {
  plugins:[
    AutoImport.vite({
      include: [
      /\.[tj]sx?$/,
      ],
      imports: ["react"]
    })
  ]
}
```

Using this code in any page like `index.jsx` works flawlessly!
```jsx
console.log(useEffect);// <- this works!
export default function(){
			return <h1 className="text-3xl font-bold text-violet-600">Hello from Reejs!</h1>
		}
```

Example config for `million`:

::: tip
Install the npm version of million and link it for the server side of import maps. Use URLs for browser side import maps. The server side is known to leverage npm hacks and methods which has a higher chance of not properly working.
:::

`packit.config.js`:
```js
import million from "million/compiler";
export default {
  plugins:[
    million.unplugin.vite({ // <- here we chose the vite edition of Millionjs
      mode: 'react', server: true
    })
  ]
}
```

If million properly works, try adding the following code in any page like `index.jsx`:
```jsx
import { block } from 'million/react';
 
const LionBlock = block(function Lion() {
  return <img src="https://million.dev/lion.svg" />;
});
 
export default LionBlock;
```

Turn on debug mode in packit by typing `d` in packit console, turn off file caching by typing `a` there too, and then type `r` to repack your code.
You will see something like this:
![hot packit pics](https://cdn.discordapp.com/attachments/889369494651293696/1148214640380219402/image.png)

---

Now if you want to create your own plugin, start using unplugin or vite as a reference, and you're good to go! Join our discord server if you need any help!