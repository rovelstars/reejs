# Create A New Reejs Project

To create a new Reejs project, run the following command:

```sh
reejs init <project-name> [options]
```

::: tip
Trying out for the first time? Don't run `-y` or `--yes` to get interactive prompts. If you're a veteran, you can run `-y` or `--yes` to skip the prompts, and apply your custom arguments along with it or it chooses the default options automatically.
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

You can find a list of all available features in the interactive prompt. You can also find them below:

- react
- preact
- tailwind
- twind
- api
- static
- million.js

--- 

Therefore, to create a new Reejs project called `my-app` with Preact, using Twind, having a REST API and serving static files, you would run the following command:

```sh
reejs init my-app -f -y
```

Reejs selects `preact, twind, api, static` by default. Therefore, you don't need to specify them. The `-y` flag skips the interactive prompt and applies the default options.

## Project Structure

The above command will create the following project structure:

```js
myapp
├── import_map.json
├── package.json
├── packit.config.js
├── public
├── reecfg.json
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
