#!/usr/bin/env node

import clean from './lib/clean.js';
import compileTypeScript from '../../build/lib/compileTypeScript.js';
import {
	tsConfigUrl,
	licenseSrc,
	readmeSrc,
	licenseDist,
	readmeDist,
} from './lib/paths.js';
import preTsc from './lib/pre-tsc.js';
import postTsc from './lib/post-tsc.js';
import copyFile from './lib/copyFile.js';

await clean();
await preTsc();
compileTypeScript(tsConfigUrl);

await Promise.all([
	postTsc(),
	copyFile(licenseSrc, licenseDist),
	copyFile(readmeSrc, readmeDist),
]);
