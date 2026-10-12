import { Command } from 'commander';
import { expect, it } from 'vitest';
import entries from './entries.js';

it('parses --no-entries as a false entries option', () => {
	const command = new Command().addOption(entries);
	command.parse(['node', 'beacon', '--no-entries']);

	expect(command.opts()).toMatchObject({ entries: false });
});
