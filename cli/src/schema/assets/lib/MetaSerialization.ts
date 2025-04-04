import readYaml from '#cli/fs/readYaml.js';
import writeYaml from '#cli/fs/writeYaml.js';
import isRecord from '#cli/util/isRecord.js';
import { stat } from 'node:fs/promises';
import type AssetMeta from '../AssetMeta.js';
import { getMetaPath } from './NamingConvention.js';

interface RawMeta {
	readonly description?: string;
	readonly tags?: readonly string[];
	readonly title: string;
}

function isRawMeta(o: unknown): o is RawMeta & Record<string, unknown> {
	return (
		isRecord(o) &&
		(!('description' in o) || typeof o.description === 'string') &&
		(!('tags' in o) ||
			(Array.isArray(o.tags) && o.tags.every((t) => typeof t === 'string'))) &&
		typeof o.title === 'string'
	);
}

export async function load(paths: {
	readonly blobPath: string;
	readonly itemPath: string;
	readonly metaPath: string;
}): Promise<AssetMeta> {
	const [parsed, blobStats] = await Promise.all([
		readYaml(paths.metaPath),
		stat(paths.blobPath),
	]);

	if (!isRawMeta(parsed)) {
		throw new Error(`Invalid asset metadata: ${paths.metaPath}`);
	}

	const { description, tags, title } = parsed;

	return {
		...(description ? { description } : {}),
		fileSize: blobStats.size,
		itemPath: paths.itemPath,
		tags: new Set(tags ?? []),
		title,
	};
}

export async function save(assetsPath: string, asset: AssetMeta) {
	const raw: RawMeta = {
		...(typeof asset.description === 'string'
			? { description: asset.description }
			: {}),

		...(asset.tags.size > 0 ? { tags: [...asset.tags].sort() } : {}),

		title: asset.title,
	};

	return writeYaml(getMetaPath(assetsPath, asset.itemPath), raw);
}
