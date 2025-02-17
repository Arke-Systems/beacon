import type { Item } from '../Types.js';
import { isItem } from '../Types.js';

export interface RawBase extends Item {
	readonly _version: number;
	readonly ACL: unknown;
	readonly content_type: string;
	readonly created_at: string;
	readonly created_by: string;
	readonly parent_uid: string | null;
	readonly tags: readonly string[];
	readonly updated_at: string;
	readonly updated_by: string;
}

function isRawBase(o: unknown): o is RawBase {
	if (!isItem(o)) {
		return false;
	}

	return (
		typeof o._version === 'number' &&
		'ACL' in o &&
		typeof o.content_type === 'string' &&
		typeof o.created_at === 'string' &&
		typeof o.created_by === 'string' &&
		(o.parent_uid === null || typeof o.parent_uid === 'string') &&
		Array.isArray(o.tags) &&
		o.tags.every((t) => typeof t === 'string') &&
		typeof o.updated_at === 'string' &&
		typeof o.updated_by === 'string'
	);
}

export interface RawFolder extends RawBase {
	readonly is_dir: true;
	readonly name: string;
}

export function isRawFolder(o: unknown): o is RawFolder {
	return isRawBase(o) && Boolean(o.is_dir) && typeof o.name === 'string';
}

export interface RawAsset extends RawBase {
	readonly description?: string | undefined;
	readonly file_size: string;
	readonly filename: string;
	readonly is_dir: false;
	readonly title: string;
	readonly url: string;
}

export function isRawAsset(o: unknown): o is RawAsset {
	return (
		isRawBase(o) &&
		(o.description === undefined || typeof o.description === 'string') &&
		typeof o.file_size === 'string' &&
		typeof o.filename === 'string' &&
		!o.is_dir &&
		typeof o.title === 'string' &&
		typeof o.url === 'string'
	);
}

export type RawAssetItem = RawAsset | RawFolder;

export function isRawAssetItem(o: unknown): o is RawAssetItem {
	return isRawAsset(o) || isRawFolder(o);
}
