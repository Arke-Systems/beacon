import { configTypes, dist, licenseDist, readmeDist } from './paths.js';
import { rm as nodeRm } from 'node:fs/promises';
import { humanizePath } from '../../../build/lib/humanize.js';

export default async function clean() {
	let filesRemoved = false;
	for (const url of [dist, configTypes, licenseDist, readmeDist]) {
		if (await rm(url)) {
			filesRemoved = true;
		}
	}

	if (!filesRemoved) {
		console.info('Nothing to clean');
	}
}

async function rm(url) {
	try {
		await nodeRm(url, { recursive: true });
		console.info('Removed', humanizePath(url));
		return true;
	} catch (ex) {
		if (ex instanceof Error && 'code' in ex && ex.code === 'ENOENT') {
			// ignore
			return false;
		}

		throw ex;
	}
}
