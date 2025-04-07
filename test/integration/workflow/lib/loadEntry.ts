import type { ContentType } from '#cli/cs/content-types/Types.js';
import type { Item } from '#cli/cs/Types.js';
import readYaml from '#cli/fs/readYaml.js';
import { resolve } from 'node:path';

export default async function loadEntry(
	dir: string,
	contentTypeUid: ContentType['uid'],
	name: string,
) {
	const resolved = resolve(dir, 'entries', contentTypeUid, `${name}.yaml`);
	return (await readYaml(resolved)) as Item;
}
