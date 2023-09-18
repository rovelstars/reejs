# Project Structure And How It Works

By default Reejs creates the following project structure:

## Page Routing

 The `src/pages` allows you to place any `<page>.<extension>` file in it where the `extension` can by one of `tsx, ts, jsx, js, mdx, md` files.
 Do note that the markdown(x) **ree**ndered will by unstyle
 d. You're expected to wrap your markdown in a component and style it yourself.

 Any filename starting with an underscore (`_`) will **not be reegistered** by the default Packit Readers & Writers as a page. This allows you to create special pages that you can import into other pages or could be used by third party Packit plugins. A good example would be the `_app.tsx` file that is used by the default Packit plugins to wrap your pages inside it.

  Example of a page:
  ```js
  // src/pages/index.jsx
  export default function Index() {
    return <h1>Hello World!</h1>;
  }
  ```


---

## API Routing

As for the `src/pages/api` directory, Packit by default uses it by default for serving it as an API route instead of **ree**ndering it as a page. This allows you to create API routes that can be used by your pages or by third party Packit plugins.
A router can only have a parameter `c` which is the `Context` object of the current request, which is passed down from [Hono's context](https://hono.dev/api/context).


Any filename starting with an underscore (`_`) will **be reegistered** by the default Packit Readers & Writers as an API **middleware**. All the middlewares are setup before any route (including API routes) is **ree**gistered, and can be sorted in order with the optional `index` variable that you need to export alongside your middleware.
By default, the value of `index` is `0` and the middlewares are not sorted in any particular order.
A middleware can only have a parameter `c` which is the `Context` object of the current request, which is passed down from [Hono's context](https://hono.dev/api/context).

Example of a middleware:

```js
// src/pages/api/_*.js

//Since our filename starts with an underscore, it will be registered as a middleware. And since we have "*" after the underscore, it will be registered as a middleware for all the routes that are registered after it.
export default function(c){
  console.log("This is a middleware!");
}

export const index = 1; //This will make sure that this middleware is registered after all the other middlewares that have an index of 0.
```

Using Hono's built in middleware(s):
  
```js
// src/pages/api/_*.js

import { logger } from 'npm:hono/logger';

export default logger;
```

**Ree**gistering a route:

```js
// src/pages/api/index.js

export default function(c) {
  return c.json({ message: 'Hello!' });
}
```

You can read more about the `Context` object [here](https://hono.dev/api/context), and `HonoRequest` object [here](https://hono.dev/api/request).

---

You can read how How Hono's routing works [here](https://hono.dev/api/routing).
