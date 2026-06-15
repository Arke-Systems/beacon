import readSerializedData from '#cli/fs/readSerializedData.js';
import writeSerializedData from '#cli/fs/writeSerializedData.js';
import getUi from '#cli/schema/lib/SchemaUi.js';
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
	const parsed = await readSerializedData(paths.metaPath);

	if (!isRawMeta(parsed)) {
		throw new Error(`Invalid asset metadata: ${paths.metaPath}`);
	}

	// Try to stat the blob file, but handle gracefully if it doesn't exist
	let blobStats;
	try {
		blobStats = await stat(paths.blobPath);
	} catch (error) {
		if (
			error &&
			typeof error === 'object' &&
			'code' in error &&
			error.code === 'ENOENT'
		) {
			const ui = getUi();
			ui.warn(
				`Asset blob file not found, skipping: ${paths.blobPath}`,
				`(Metadata exists at: ${paths.metaPath})`,
			);
			throw error; // Re-throw to indicate load failed, so caller can skip this asset
		}
		throw error;
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
	const ui = getUi();
	const format = ui.options.schema.serializationFormat;
	const raw: RawMeta = {
		...(typeof asset.description === 'string'
			? { description: asset.description }
			: {}),

		...(asset.tags.size > 0 ? { tags: [...asset.tags].sort() } : {}),

		title: asset.title,
	};

	return writeSerializedData(
		getMetaPath(assetsPath, asset.itemPath, format),
		raw,
		format,
	);
}
