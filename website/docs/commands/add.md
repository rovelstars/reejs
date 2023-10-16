# `reejs add`

Installs dependencies from/to `import_map.json`.

```bash
reejs add <name> <url> [options]
```

Aliases:

- `reejs install`
- `reejs i`

Options:

- `-f, --force` - Install the URLs without adding them to `import_map.json`. You don't need `name` parameter if you use this option.
- `-b, --browser` - Install the URLs as browser dependencies. This dependency will be added to `import_map.json` and will be available in the browser.
- `-u, --user-agent` - Set the user agent for the request. Default: `<Runtime>/<Runtime version> (reejs/<reejs version>)`

Examples:

```bash
reejs add react https://cdn.skypack.dev/react
reejs install # Install all dependencies from import_map.json
reejs add react https://cdn.skypack.dev/react -b # Install react as browser dependency
```
