# Reejs

### Self Hosting:

Tailwind CSS Cdn fix: goto `shell.js` and change isLocalDev to false, or else it will not work.
If you are developing reejs locally and using "disable cache" in your browser, download tailwind cdn code [here](https://cdn.tailwindcss.com) and add it to the root of the folder as the name `tw.js` and keep isLocalDev to true. This will save you lot of bandwidth (300kb nearly every time).

Install `http-server`

```bash
npm install -g http-server
```

Then run `http-server`

```bash
http-server
```

Then Visit http://127.0.0.1:8080/