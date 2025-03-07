#!/usr/bin/env node

import { styleText } from 'node:util';
import { spawnSync } from 'node:child_process';
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
await postTsc();

runTests();

await Promise.all([
	copyFile(licenseSrc, licenseDist),
	copyFile(readmeSrc, readmeDist),
]);

function runTests() {
	const result = spawnSync(
		'yarn',
		[
			'workspace',
			'@arke-systems/beacon-test',
			'vitest',
			'run',
			'--no-api',
			'--bail',
			'1',
		],
		{
			stdio: 'inherit',
		},
	).status;

	if (result !== 0) {
		console.warn(styleText('redBright', 'Tests failed'));
		process.exit(result);
	}
}
