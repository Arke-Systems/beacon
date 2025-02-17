#!/usr/bin/env node

import compileTypeScript from '../../build/lib/compileTypeScript.js';
import { tsConfigUrl } from './lib/paths.js';
import preTsc from './lib/pre-tsc.js';
import postTsc from './lib/post-tsc.js';

await preTsc();
compileTypeScript(tsConfigUrl);
await postTsc();
