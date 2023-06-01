# Ree.js
> A web framework that's built different. Built for speed, simplicity, and compatibility.

## Installation
```bash
# You need to have Node.js installed v18+
npm install -g reejs
```

## Usage

### Create a new project
```bash
reejs init <project-name> --features <features>
```

Example:
```bash
reejs init my-project --features react,tailwind,api,static # Creates a new project with React, Tailwind (TwindCSS), API, and Static File Serving features
```

### Install dependencies
> Run `npm i` one time in your project directory to install reejs dependencies. This will be automated in the below scripts in the future.
```bash
reejs install && reejs sync
```

### Start the development server
```bash
reejs packit <runtime> -d
```

Runtimes available at [here](https://github.com/rovelstars/reejs/blob/d9e143d9f9713ec2c37b6d92e0be34e454acb826/src/cli/cmds/packit.bkp.js#LL53C1-L53C1)

### Build for production
```bash
reejs packit <runtime>
```

The files are saved in `packit` directory. We decided to not start the folder name with a dot (.) because some runtimes dont allow running files from there ._. (I'm looking at you, Deno Deploy)

## Features Ideology

Ree.js is built to be modular. You can add or remove features as you like. You can even create your own features and share them with the community.

## Packit Ideology

Packit is a pluggable based transpiler. Packit's contract is that you provide working code and it provides you back with a transpiled javascript code. For `.js` files, assume it nearly doesn't change anything except URL Imports to local files on unsupported runtimes. Packit enables your code to be run on different runtimes, special thanks to [Hono](https://hono.dev) server. While people say Vite and other transpilers are so much fast, they only happen to be faster on New Desktop Computers. Try running them on a low end/old device like a 12yr old PC or on an Android device (with/on Termux), you are going to thanks for Reejs' lightweight size and the blazing fast speed for both dev and prod builds.

## URL Imports Ideology

URL Imports is a way to import files from the web. We consider it's a faster and simpler alternative than NPM.
Incase you think it's a security issue, we have a solution for that. We have a `reejs sync` command that will download all the dependencies and save them locally. This way, you can be sure that your code is safe and secure. Since URL Import services will only serve wasm instead of native binaries, you don't need to worry about failing to run on other platforms.

BTW, if you hate URL Imports because you be sent malicious code randomly, NPM too suffers from the same issue. For security reasons, Reejs will itself suggest you to pin down your dependencies to a specific version. This way, you can be sure that your code is safe and secure. But if suspect the hoster of the URL Import services, you should doubt NPM hosting too. Anyways, esm.sh allows easy self hosting over Deno Deploy, check them out!

## Contributing

We welcome all contributions. Please read our [CONTRIBUTING.md](https://github.com/rovelstars/reejs/blob/main/CONTRIBUTING.md)

## Roadmap

- [x] Reewrite Packit to be modular
- [ ] Packit in dev mode should run hono server in dev mode, and dynamically transpile & load files on a request.
- [ ] Fix development mode server (spawned child process not killed...)
- [ ] Support for wasm based dependencies on URL Import
- [ ] Reewrite init command to be modular
- [ ] Add support for more runtimes
- [ ] Reewrite `specialFileImport.js` in `@reejs/imports` to be more readable
- [ ] Write Docs and make website look more cooler
- [ ] Download browser dependencies and serve them locally (only in production mode)
- [ ] Hit 1k stars on GitHub :D
- [ ] Add support for more languages (vue, svelte, etc.)
- [ ] Make Reejs more faster (we can do better haha!)
- [ ] Allow importing files under a scope url (like being able to import `@reejs/utils/log.js` when import maps has`@reejs/utils`). I expect packit to be able to handle this, rather than `@reejs/imports` handling it. Packit should probably save this data to a seperate object in import maps from where `@reejs/imports` can read it in future.

## Benchmark

> Ran on Pentium G620 @ 2.60GHz (released in Q2'11), 8GB DDR3 RAM, Arch Linux on 1st June 2023 Reejs v0.9.15, Nodejs v18.16.0

> Important Note: This tests were ran manually, and the observations were noted manually. Since different frameworks have different ways and ideas of how it should run, please think of this benchmarks as approx data (except folder sizes). Only Reejs Packit provides required data, and nextjs dev builds run transpilers 2-3 times when booting up, so its written as it is.

Reejs: default React project with features `react,tailwind,api,static`
Vite: default react project
Nextjs: default nextjs project: no typescript, no eslint, no tailwind, no app router.
### Transpilers (dev) - First Time

| Transpiler  | Time                |
|-------------|---------------------|
| Packit      | 98ms                | 
| Vite        | 547ms               |
| Swc (Nextjs)| 5.8s + 845ms + 1.8s |

### Transpilers (dev) - Edit and reevert file (Ree-run without cold boot)

| Transpiler  | Time                 |
|-------------|----------------------|
| Packit      | 42ms                 |
| Vite        | 225ms                |
| Swc (Nextjs)| 1.4s + 932ms + 422ms |

### Transpilers (production build)

| Transpiler  | Time    |
|-------------|---------|
| Packit      | 198ms   |
| Vite        | 2.31s   |
| Swc (Nextjs)| 37.68s  |


## Default Project sizes

Running `du -sh .` inside the project folder after installing dependencies, running both dev and prod build. No files must be deleted.

Reejs - 1.8MiB
Vite - 89MiB
Nextjs - 333MiB

While you might say Different Framework's default projects are having images, css files shoved right into them, they don't make that much of a difference between 1MiB, 89MiB, 333MiB.

## Server Benchmarks

Reejs Uses Hono Server under the hood, and that's one of the reasons how we could have such a small ram and storage footprint, alongwith built-in support for running on different runtimes and services out of the box.

Vite Uses Their Own (Not Disclosed/Made specifically for Vite) Server

Nextjs Uses Expressjs

You can find Server Benchmarks over https://github.com/denosaurs/bench

---

## About Reejs & Why the name?

![Ree](https://i.kym-cdn.com/entries/icons/mobile/000/017/830/reee.jpg)

"Ree" is based on a meme that expresses one's intense rage or frustation typically associated with the Pepe character. [More Info on knowyourmeme.com](https://knowyourmeme.com/memes/reeeeeee)
I (@renhiyama) started working on my own web framework when I realised older or low end devices can no longer keep up with the ~~speed~~ slow builds of Transpilers and Web Frameworks. I thought of using different technologies and stupid ideas that just seem to work and it turned out that it's way faster & better than the current generation of Web Frameworks. While Reejs does try to solve compability issues, if you find any bugs, please make an issue.