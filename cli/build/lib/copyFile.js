import { copyFile as nodeCopyFile } from 'node:fs/promises';
import { humanizePath } from '../../../build/lib/humanize.js';

export default async function copyFile(src, dest) {
	console.info('Copying', humanizePath(src), 'to', humanizePath(dest));
	await nodeCopyFile(src, dest);
}
