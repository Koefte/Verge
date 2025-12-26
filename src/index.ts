import { Tokenizer } from './tokenizer.js';
import { Parser } from './parser.js';
import { simplify, converge } from './converge.js';

const tokenizer = new Tokenizer("2n+5/3n-7");

const tokens = tokenizer.tokenize();
const parser = new Parser(tokens);
const ast = parser.parse();
console.log(converge(simplify(ast)));
