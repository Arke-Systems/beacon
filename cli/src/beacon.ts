#!/usr/bin/env node

import { Command } from 'commander';
import clear from './ui/command/clear.js';
import pull from './ui/command/pull.js';
import push from './ui/command/push.js';
import validateReferences from './ui/command/validateReferences.js';
import version from './ui/version.js';

const program = new Command();

program
	.version(await version())
	.description('Beacon CLI')
	.addCommand(clear)
	.addCommand(pull)
	.addCommand(push)
	.addCommand(validateReferences);

await program.parseAsync();
