#!/usr/bin/env node

import { styleText } from 'node:util';
import cliPreTsc from '../cli/build/lib/pre-tsc.js';
import compileTypeScript from './lib/compileTypeScript.js';
import cliPostTsc from '../cli/build/lib/post-tsc.js';

console.info(styleText(['bold', 'underline'], '\nBuilding project...'));

const tsConfigUrl = new URL('../tsconfig.json', import.meta.url);

await cliPreTsc();
compileTypeScript(tsConfigUrl);
await cliPostTsc();
