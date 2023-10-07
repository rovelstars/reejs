# Ree.js

> A web framework that's built different. Built for speed, simplicity, and compatibility.

## Read Documentation

Documentation is available at [here](https://ree.js.org/docs)

## Contributing

We welcome all contributions. Please read our [CONTRIBUTING.md](https://github.com/rovelstars/reejs/blob/main/CONTRIBUTING.md)

## Roadmap

- [x] Reewrite Packit to be modular
- [ ] Packit in dev mode should run hono server in dev mode, and dynamically transpile & load files on a request.
- [x] Fix development mode server (spawned child process not killed...)
- [x] Support for wasm based dependencies on URL Import
- [ ] Reewrite init command to be modular
- [ ] Add support for more runtimes
- [ ] Reewrite `specialFileImport.js` in `@reejs/imports` to be more readable
- [x] Write Docs and make website look more cooler
- [x] Add Useful/Important Components like `Head`, `Link` & `Image` (Idea from Nextjs)
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

| Transpiler   | Time                |
| ------------ | ------------------- |
| Packit       | 98ms                |
| Vite         | 547ms               |
| Swc (Nextjs) | 5.8s + 845ms + 1.8s |

### Transpilers (dev) - Edit and reevert file (Ree-run without cold boot)

| Transpiler   | Time                 |
| ------------ | -------------------- |
| Packit       | 42ms                 |
| Vite         | 225ms                |
| Swc (Nextjs) | 1.4s + 932ms + 422ms |

### Transpilers (production build)

| Transpiler   | Time   |
| ------------ | ------ |
| Packit       | 198ms  |
| Vite         | 2.31s  |
| Swc (Nextjs) | 37.68s |

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
