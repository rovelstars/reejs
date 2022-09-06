import * as lexer from "./utils/lexer.js";
await lexer.init;

console.log("hmm",lexer.parse("import { a } from 'b'"));