#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import * as prettier from 'prettier';
import { src } from './lib/paths.js';
import { fileURLToPath } from 'node:url';

const fileUrl = new URL('./cs/api/cma-openapi-3.d.ts', src);
const filePath = fileURLToPath(fileUrl);

const managementOpenApi =
	'https://assets.contentstack.io/v3/assets/blt02f7b45378b008ee' +
	'/blt85399a97399b4ecf/cma-openapi-3.json?v=3.0.0';

const result = spawnSync(
	'yarn',
	[
		'workspace',
		'@arke-systems/beacon-cli',
		'openapi-typescript',
		managementOpenApi,
		'--output',
		filePath,
	],
	{
		stdio: 'inherit',
	},
).status;

if (result !== 0) {
	process.exit(result);
}

const [ugly, options] = await Promise.all([
	readFile(filePath, 'utf-8'),
	prettier.resolveConfig(filePath),
]);

const pretty = await prettier.format(ugly, {
	...options,
	parser: 'typescript',
});

await writeFile(filePath, pretty, 'utf-8');
