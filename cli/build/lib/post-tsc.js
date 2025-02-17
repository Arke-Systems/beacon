import { copyFile, chmod } from 'node:fs/promises';
import { configSchema, configDist, cliDist } from './paths.js';
import { humanizePath } from '../../../build/lib/humanize.js';

export default async function postTsc() {
	console.info(
		'Copying',
		humanizePath(configSchema),
		'to',
		humanizePath(configDist),
	);

	await copyFile(configSchema, configDist);

	console.info('Setting executable flag on', humanizePath(cliDist));

	const executableFlags = 0o755;
	await chmod(cliDist, executableFlags);
}
