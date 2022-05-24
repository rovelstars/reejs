# Reejs

A serverless reactjs framework that teases no-build-step and is serverless-first due to being a static site.
Currently we are developing a sample site along with reejs in this codebase itself in order to showcase the possibilities of this framework. Feel free to report any bugs at the issues section or introduce new ideas in discussions!
We shall rewrite this, remove sample code and make reejs possible to run for other sites as well.

Currently it showcases:
- Tailwind based CSS generation
- [Tailwind gen](https://github.com/rovelstars/tailwind-gen)
- Custom ReeRouter
- Custom Reender
- Service Worker that makes it possible for the site to run offline, and also allows directly visiting pages directly from the pages (a static file server would send 404 pages for non-existing pages, so this is a great achievement!)
- (WIP!) Reebugger (a debugging tool for Reejs)

### Self Hosting:

Install `http-server`

```bash
npm install -g http-server
```

Then run `http-server`

```bash
http-server
```

Then Visit http://127.0.0.1:8080/