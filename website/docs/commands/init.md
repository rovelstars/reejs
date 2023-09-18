# `reejs init`

:::tip
We suggest using `npx create reejs` to create your next new project. This command is deprecated and will be removed in the future.
:::

This command will create a new project in the specified directory.

Usage:

```sh
reejs init <project-name> [options]
```

# Choosing Features

We define features as something that you can add-on to your project. For example, you can add a feature to your project that allows you to use a database. You could also add a feature that allows you to use a specific template engine.
To add a feature to your project, run the following command:

```sh
reejs init <project-name> --features <feature-names>
```

:::tip
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

