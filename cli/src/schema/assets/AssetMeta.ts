import type { RawAsset } from '#cli/cs/assets/Types.js';

export default interface AssetMeta {
	readonly description?: string;
	readonly fileSize: number;
	readonly itemPath: string;
	readonly tags: ReadonlySet<string>;
	readonly title: string;
}

export function fromRawAsset(item: RawAsset, itemPath: string): AssetMeta {
	return {
		...(item.description ? { description: item.description } : {}),
		fileSize: parseInt(item.file_size, 10),
		itemPath,
		tags: new Set(item.tags),
		title: item.title,
	};
}
