import {build} from 'esbuild';
import {copyFile} from 'node:fs/promises';
await build({entryPoints:['src/main.tsx'],outfile:'../dist/enhancements.js',bundle:true,minify:true,format:'iife',target:['es2020'],jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},legalComments:'eof',tsconfig:'tsconfig.json'});
await copyFile('src/styles.css','../dist/enhancements.css');
console.log('Built static UI islands: dist/enhancements.js + enhancements.css');
