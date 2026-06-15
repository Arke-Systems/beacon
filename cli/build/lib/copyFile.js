import { copyFile as nodeCopyFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { humanizePath } from '../../../build/lib/humanize.js';

export default async function copyFile(src, dest) {
	console.info('Copying', humanizePath(src), 'to', humanizePath(dest));

	// Ensure the destination directory exists
	const destPath = dest instanceof URL ? fileURLToPath(dest) : dest;
	await mkdir(dirname(destPath), { recursive: true });

	await nodeCopyFile(src, dest);
}
