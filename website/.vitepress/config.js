import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  lang: "en-US",
  title: "Ree.js",
  description: "Say Goodbye to slow build times",
  lastUpdated: true,
  cleanUrls: true,
  sitemap: {
    hostname: "https://ree.js.org",
  },
  editLink: {
    pattern: "https://github.com/rovelstars/reejs/edit/main/website/:path",
  },
  head: [
    ["meta", { name: "theme-color", content: "#5f67ee" }],
    [
      "meta",
      {
        name: "google-site-verification",
        content: "LCR6hOS2RiaSDCMlJjkjsh2ZoN8y5wDuYW1QJLcw8bA",
      },
    ],
    ["meta", { name: "og:type", content: "website" }],
    ["meta", { name: "og:locale", content: "en" }],
    ["meta", { name: "og:site_name", content: "Reejs" }],
    ["script", { async: true, src: "https://arc.io/widget.min.js#yxxqCYDf" }],
  ],
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    footer: {
      message: "Released under the MIT License.",
      copyright:
        'Copyright © 2020-present <a class="link" href="//rovelstars.com">Rovel Stars</a>',
    },
    nav: [
      { text: "Home", link: "/" },
      { text: "Guide", link: "/docs/getting-started/introduction" },
      { text: "Docs", link: "/docs" },
    ],
    search: {
      provider: "local",
    },
    sidebar: [
      {
        text: "Getting Started",
        items: [
          { text: "Introduction", link: "/docs/getting-started/introduction" },
          { text: "Installation", link: "/docs/getting-started/installation" },
          {
            text: "Create new project",
            link: "/docs/getting-started/create-project",
          },
        ],
      },
      {
        text: "Basics",
        items: [
          { text: "Hydration", link: "/docs/basics/hydration" },
          { text: "Import Maps", link: "/docs/basics/import-maps" },
          { text: "Packit", link: "/docs/basics/packit" },
          { text: "Server", link: "/docs/basics/server" },
          { text: "Project Structure", link: "/docs/basics/struct" },
          { text: "URL Imports", link: "/docs/basics/url-imports" },
        ],
      },
      {
        text: "Commands",
        items: [
          { text: "add", link: "/docs/commands/add" },
          { text: "init", link: "/docs/commands/init" },
          { text: "packit", link: "/docs/commands/packit" },
          { text: "repl", link: "/docs/commands/repl" },
          { text: "task", link: "/docs/commands/task" },
          { text: "x", link: "/docs/commands/x" },
        ],
      },
      {
        text: "Packages",
        items: [{ text: "@reejs/imports", link: "/docs/packages/imports" }],
      },
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/rovelstars/reejs" },
      { icon: "discord", link: "https://discord.rovelstars.com/server" },
      { icon: "x", link: "https://x.com/rovelstars" },
    ],
  },
});
