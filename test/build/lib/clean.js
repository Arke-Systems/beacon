import { readdir, rm } from 'node:fs/promises';
import { projectRoot } from './paths.js';
import { humanizePath } from '../../../build/lib/humanize.js';

export default async function clean() {
	const toRemove = [];

	for (const dirent of await readdir(projectRoot, { withFileTypes: true })) {
		if (!dirent.isDirectory()) {
			continue;
		}

		if (dirent.name.startsWith('.tmpX')) {
			toRemove.push(new URL(dirent.name, projectRoot));
		}
	}

	for (const url of toRemove) {
		console.info('Removing', humanizePath(url));
		await rm(url, { force: true, recursive: true });
	}
}
