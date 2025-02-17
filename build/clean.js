#!/usr/bin/env node

import { styleText } from 'node:util';
import cleanCli from '../cli/build/lib/clean.js';
import cleanTest from '../test/build/lib/clean.js';

console.info(styleText(['bold', 'underline'], '\nCleaning project...'));
await Promise.all([cleanCli(), cleanTest()]);
