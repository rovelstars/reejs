# Introduction

Welcome to Ree.js Documentation! This documentation is for the latest version of Ree.js. <!--If you are using an older version, please refer to the [Older Versions](#) section.-->

## What Is Reejs?

Reejs/Ree.js is a framework for building web applications at scale. It is designed to be simple, flexible and powerful.

With Ree.js, your code stays small in size, and your development experience becomes better and your code builds instantly.
Load most of the npm & deno modules via URL Imports and they just work 🚀

```jsx
import { useEffect, useState } from "https://esm.sh/react";
//or use the Import function
import Import from "@reejs/imports";
let confetti = await Import("https://esm.sh/canvas-confetti");

export default function App() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    confetti(
      {
        particleCount: count,
        spread: 70,
        origin: { y: 0.6 },
      },
      {
        resize: true,
      },
    );
  }, []);

  return (
    <div>
      <h1>Hello, Ree.js!</h1>
      <button
        onClick={() => {
          setCount(count++);
        }}
      >
        Click me
      </button>
      <p>You clicked {count} times</p>
    </div>
  );
}
```

The above code just works out of the box thanks to URL Imports feature. Rest assured, you only download what you need, and nothing more.
Here the `Import` function is used to load the `canvas-confetti` module from `esm.sh` CDN. You could also just use `Import("canvas-confetti")` and it will automatically load the module from `esm.sh` CDN.
And just like how you can use the `npm:` specifier in Deno, you can use the `npm:` specifier in Ree.js as well.

```js
import chalk from "npm:chalk";
//use it like you would normally do
console.log(chalk.red("Man I really love Ree.js!"));
```

How cool is that? 🤩
