---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "Ree.js"
  text: "Say Goodbye to slow <span style='color: #ef4444'>build times</span>"
  tagline: "Finally the best of both worlds: Fast build times and a great developer experience"
  actions:
    - theme: brand
      text: Get Started
      link: /docs/getting-started/introduction
    - theme: alt
      text: Install
      link: /docs/getting-started/installation

features:
  - icon: ⚡️
    title: Most Runtimes Supported
    details: Apps and Websites made with Reejs uses web standards & isomorphic code, which allows it to easily run on most runtimes.
  - icon: ⌛️
    title: Make the most of your time
    details: Powered by <a class="link" href="//sucrase.io/">sucrase</a>, packit is faster than other tools, which makes sure you don't waste time waiting for your app to build.
  - icon: 🌐
    title: URL Imports
    details: Supports directly importing packages from URLs, use most of the npm packages from <a class="link" href="//esm.sh">esm.sh</a>, <a class="link" href="//deno.land/x">deno.land/x</a> or any other URL Imports Service.
  - icon: 🌏️
    title: We love our planet
    details: By importing packages from URLs, packit or any other build tool doesn't need to re-build your dependencies, which conserves energy and reduces carbon emissions.
  - icon:
      src: https://hono.dev/images/logo.png
      alt: Hono
    title: Powered by <a class="link" href="//hono.dev">Hono</a>
    details: Hono makes it possible for your app to boot fast, and stay fast. It's best in class, built on web standards, and ready to serve your clients.
  - icon:
      src: https://twind.style/twind-logo-animated.svg
      alt: Twind
    title: <a class="link" href="//twind.dev">Twind</a>, a tailwind alternative
    details: The smallest, fastest, most feature complete tailwind-in-js solution in existence. Get all the benefits of Tailwind without the need for PostCSS, configuration, purging, or autoprefixing.
  - icon: 🍱
    title: Packit
    details: Our own code transpiler and bundler. It's responsible for making sure your app is fast and works on most runtimes. Compatible with even some <a class="link" href="//vitejs.dev">Vite</a> & Rollup plugins.
  - icon: 🥰
    title: Let's Be Friends!
    details: Hono works great with other WinterCG compliant frameworks like <a class="link" href="//www.npmjs.com/package/itty-router">itty-router</a>, <a class="link" href="//www.npmjs.com/package/@remix-run/router">@remix-run/router</a>, <a class="link" href="//elysiajs.com/">ElysiaJS</a> and more.
  - icon: 🔋
    title: Batteries Included
    details: Reejs comes with a package manager, bundler (packit), runtime, and even <code>npx</code> executor alternative. It has everything you need to get started. Whether you're into building websites, or CLIs, Reejs has you covered.
---