# Create A New Reejs Project

To create a new Reejs project, run the following command:

```sh
reejs init <project-name> [options]
```

::: warning
After creating the project, you must run `reejs i && reejs sync && npm i` only for the first time. This installs some necessary reejs dependencies. This process will be removed soon in the future.
:::

# Choosing Features

We define features as something that you can add-on to your project. For example, you can add a feature to your project that allows you to use a database. You could also add a feature that allows you to use a specific template engine.
To add a feature to your project, run the following command:

```sh
reejs init <project-name> --features <feature-names>
```

::: tip
You can select multiple features by separating them with a comma. You must not add spaces between the feature names.
:::

# Available Features

You can find a list of all available features below.

- react
- tailwind
- api
- static

Therefore, to create a new Reejs project called `my-app` with React, using TailwindCSS, having a REST API and serving static files, you would run the following command:

```sh
reejs init my-app --features react,tailwind,api,static
```

## Project Structure

The above command will create the following project structure:

```js
myapp
├── import_map.json
├── package.json
├── packit.config.js
├── public
├── src
│   ├── components
│   └── pages
│       ├── api
│       │   └── index.js
│       ├── _app.jsx
│       ├── index.jsx
│       └── _twind.js
├── tailwind.config.js
└── twind.config.js

6 directories, 9 files
```
