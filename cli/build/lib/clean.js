import { rm } from 'node:fs/promises';
import { configTypes, dist } from './paths.js';
import { humanizePath } from '../../../build/lib/humanize.js';

export default async function clean() {
	for (const url of [dist, configTypes]) {
		console.info('Removing', humanizePath(url));
		await rm(url, { force: true, recursive: true });
	}
}
