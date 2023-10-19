//provide typings for the config object
/**
 * This allows you to setup Packit configuration in a typesafe way.
 */
export interface PackitConfig {
  /**
   * Represents a reader object that can read files and return their contents as an array of strings.
   */
  readers?: Reader[];
  /**
   * Represents a transpiler object that can transpile files and return their contents as an array of strings.
   */
  transpilers?: Transpiler[];
  /**
   * Represents a writer object that can write files and return their contents as an array of strings.
   */
  writers?: Writer[];
  /**
   * A Copier will copy the file to the packit directory in your project. By default, Packit copies:
   * - `package.json`
   * - `node_modules`
   * - `import_map.json`
   * - `tailwind.config.js`
   * - `twind.config.js`
   * - `.reecfg`
   */
  copyToPackit?: string[];
}

interface Reader {
  /**
   * The name of the reader. Must be unique among all readers.
   */
  name: string;

  /**
   * A function that runs the reader and returns an array of strings representing the contents of the files read.
   * Returns a Promise that resolves to the array of strings.
   */
  run?: () => Promise<string[]> | string[];

  /**
   * A glob pattern that specifies the files to be read by the reader.
   */
  pattern?: string;
  /**
   * An array of files to exclude from the reader.
   * Is optional even when you use `pattern` property
   */
  exclude?: string[];
}

//in reader, either run() or pattern must be defined. if both are defined, typescript should throw an error

interface Transpiler {
  (path: string, content: string): Promise<string>;
}

interface Writer {
  (path: string, content: string): Promise<void>;
}

//declare the config object
/**
 * This allows you to setup Packit configuration in a typesafe way.
 */
export function defineConfig(config: PackitConfig): PackitConfig {
  return config;
}

//example code:
// export default defineConfig({
//   readers: [{
//     name: "example",
//     run: () => {
//       return ["src/example.js"] // return an array of files
//     }, //a function that returns an array of files, if undefined, Packit will look for `pattern` property

//     pattern: "src/*.js" // a glob pattern to match files
//     exclude: ["src/example.js"] // an array of files to exclude. Is optional even when you use `pattern` property
//   }],
//   transpilers: [{
//     name: "js",
//     run: (fileURL, service) => {
//       return fileURL; // return the fileURL of transpiled/built file.
//       //by default, Reejs saves files in `.reejs/serve/<shasum of fileURL>.js` format. we recommend you to do the same.
//       //you can make use of `service` argument to check which service is packit running for. Take a look at the `Using Packit` section for more info.
//     }
//   }],
//   writers: [{
//     name: "finish",
//     writeIndex: 100,//optional, defaults to 0
//     index: 2, //optional, defaults to 0
//     describe:
//       "Writes the necessary lines that starts the Hono server, based on what service you asked",
//     run: async (helpers, service) => {
//       // `helpers` is an object that contains `DATA` property, which includes useful functions and data. one needs to use `helpers.DATA` to access it. and pass it to the next writer with modified data (if any) to the next writer.
//       //chunk adds string to the end of the file. use it to add lines to the end of the file.
//       return { chunk: "", DATA: helpers.DATA };
//     }
//   }],
//   copyToPackit: [],
// });
