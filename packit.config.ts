import { defineConfig } from "./packit_intellisense";

export default defineConfig({
  readers: [{
    name: "example",
    run: () => {
      return ["src/example.js"]
    },
    pattern: "src/*.js", // a glob pattern to match files
    exclude: ["src/example.js"] // an array of files to exclude. Is optional even when you use `pattern` property
  }],
  transpilers: [{
    name: "js",
    run: (fileURL, service) => {
      return fileURL; // return the fileURL of transpiled/built file.
      //by default, Reejs saves files in `.reejs/serve/<shasum of fileURL>.js` format. we recommend you to do the same.
      //you can make use of `service` argument to check which service is packit running for. Take a look at the `Using Packit` section for more info.
    }
  }],
  writers: [{
    name: "finish",
    writeIndex: 100,//optional, defaults to 0
    index: 2, //optional, defaults to 0
    describe:
      "Writes the necessary lines that starts the Hono server, based on what service you asked",
    run: async (helpers, service) => {
      // `helpers` is an object that contains `DATA` property, which includes useful functions and data. one needs to use `helpers.DATA` to access it. and pass it to the next writer with modified data (if any) to the next writer.
      //chunk adds string to the end of the file. use it to add lines to the end of the file.
      return { chunk: "", DATA: helpers.DATA };
    }
  }],
  copyToPackit: [],
});
