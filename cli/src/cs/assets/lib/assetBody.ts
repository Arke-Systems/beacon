import mime from 'mime/lite';
import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { getBlobPath } from '../../../schema/assets/lib/NamingConvention.js';
import type { RawAsset } from '../Types.js';

type MutableFields = 'description' | 'parent_uid' | 'tags' | 'title';
type Props = Partial<Pick<RawAsset, MutableFields>> & {
	readonly filePath?: string;
};

export default async function assetBody({
	description,
	filePath,
	parent_uid: parentUid,
	tags: allTags,
	title,
}: Props) {
	const tags = new Set(allTags ?? []);
	const fd = new FormData();

	if (description) {
		fd.append('asset[description]', description);
	}

	if (parentUid) {
		fd.append('asset[parent_uid]', parentUid);
	}

	if (tags.size > 0) {
		fd.append('asset[tags]', [...tags].join(', '));
	}

	if (title) {
		fd.append('asset[title]', title);
	}

	if (filePath) {
		const value = await readFile(getBlobPath(filePath));

		fd.append(
			'asset[upload]',
			new Blob([value], {
				endings: 'transparent',
				type: mime.getType(filePath) ?? 'application/octet-stream',
			}),
			basename(filePath),
		);
	}

	return fd;
}
