<div align='center'>
  <a href="//ree.js.org">
  <img src="https://dev-to-uploads.s3.amazonaws.com/uploads/articles/st8dij8atau8h8brnahu.png" height='130px' width='331.5px' alt="Ree.js" />
  </a>
  <h3>Finally the best of both worlds: Fast build times and a great developer experience 😎</h3>
</div>

<!-- show some badges -->
<p align="center">
<img alt="GitHub Sponsors" src="https://img.shields.io/github/sponsors/renhiyama?style=for-the-badge&logo=github">
<img alt="GitHub contributors" src="https://img.shields.io/github/contributors/rovelstars/reejs?style=for-the-badge">
<img alt="npm" src="https://img.shields.io/npm/dw/reejs?style=for-the-badge">
<img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/rovelstars/reejs?style=for-the-badge">
<img alt="GitHub forks" src="https://img.shields.io/github/forks/rovelstars/reejs?style=for-the-badge">
<img alt="GitHub issues" src="https://img.shields.io/github/issues/rovelstars/reejs?style=for-the-badge">
<a href="https://twitter.com/rovelstars">
  <img alt="X (formerly Twitter) Follow" src="https://img.shields.io/twitter/follow/rovelstars">
</a>
<a href="https://twitter.com/ren_hiyama_gg">
  <img alt="X (formerly Twitter) Follow" src="https://img.shields.io/twitter/follow/ren_hiyama_gg">
</a>
  </p>

> Ree.js is a library that makes web development faster and easier by providing features such as URL Imports, JSX support, and server-side rendering. URL Imports are a way of importing modules from URLs instead of local files or npm packages. This can reduce the download size and improve the performance of your web applications. It doesn't hurt to use the latest features for better performance, right?

## 📖 Read Documentation

Documentation is available at [here](https://ree.js.org/docs) . If you find any mistakes, please make an issue. Incase you have any questions, please ask them on our [Discord Server](https://discord.rovelstars.com/server)

## ✒️ Contributing

We welcome all contributions. Please read our [CONTRIBUTING.md](https://github.com/rovelstars/reejs/blob/main/CONTRIBUTING.md)

## 🛣️ Roadmap

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

## 🚤 Benchmark

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
| Packit       | 17ms                 |
| Vite         | 225ms                |
| Swc (Nextjs) | 1.4s + 932ms + 422ms |

### Transpilers (production build)

| Transpiler   | Time   |
| ------------ | ------ |
| Packit       | 172ms  |
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
