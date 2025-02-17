import type { ContentType } from '../content-types/Types.js';
import type { Entry, ReferencePath } from './Types.js';

export default function parseReferencePath(path: ReferencePath): {
	readonly contentTypeUid: ContentType['uid'];
	readonly title: Entry['title'];
} {
	const [contentTypeUid, ...titleSegments] = path.split('/');

	if (typeof contentTypeUid !== 'string') {
		throw new Error(`Invalid reference path: ${path}`);
	}

	return { contentTypeUid, title: titleSegments.join('/') };
}
