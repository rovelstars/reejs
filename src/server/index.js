import env from "../imports/env.js";
// create a constructor function for the server
class ReeServer {
  constructor(server, opts) {
    this.server = server;
	  //{Hono} from hono package is `server` in this case
    this.app = new this.server({strict: false});
    this.opts = opts;
  }
  pickup(pages, components, api) { pages.forEach((page) => {}); }
  use(mod) { mod({app : this.app, opts : this.opts, server : this.server}); }
  // create a method to start the server
  listen(port, cb) {
    if (env == "node") {
      this.opts.serve({fetch : this.app.fetch, port : port});
    } else if (env == "bun") {
      return {
        port: globalThis?.process?.env?.PORT || 3000, fetch: this.app.fetch,
      }
    } else if (this.opts.config.runtime == "vercel") {
      // vercel
      return this.opts.handle(this.app, this.opts.path);
    } else if (this.opts.config.runtime == "fastly") {
      return this.app.fire();
    } else if (this.opts.config.runtime == "cloudflare-pages") {
      return this.opts.handle(this.app, this.opts.path);
    } else {
      return this.app;
    }
    cb();
  }
}

export default ReeServer;
