import type { ContentType } from '#cli/cs/content-types/Types.js';
import readYaml from '#cli/fs/readYaml.js';
import { resolve } from 'node:path';

export default async function loadContentType(
	dir: string,
	contentTypeUid: ContentType['uid'],
) {
	const resolved = resolve(dir, 'content-types', `${contentTypeUid}.yaml`);
	return (await readYaml(resolved)) as ContentType;
}
