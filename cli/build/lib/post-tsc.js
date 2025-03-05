import { chmod } from 'node:fs/promises';
import { configSchema, configDist, cliDist } from './paths.js';
import { humanizePath } from '../../../build/lib/humanize.js';
import copyFile from './copyFile.js';

export default async function postTsc() {
	await copyFile(configSchema, configDist);

	console.info('Setting executable flag on', humanizePath(cliDist));

	const executableFlags = 0o755;
	await chmod(cliDist, executableFlags);
}
