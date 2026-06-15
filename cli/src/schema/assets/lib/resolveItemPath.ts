import type { RawAssetItem } from '#cli/cs/assets/Types.js';
import { isRawFolder } from '#cli/cs/assets/Types.js';
import normalizeFolderName from './normalizeFolderName.js';

export default function resolveItemPath(
	byUid: ReadonlyMap<string, RawAssetItem>,
	item: RawAssetItem,
): string {
	const { parent_uid: parentUid } = item;
	const rawName = isRawFolder(item) ? item.name : item.filename;
	// Normalize folder names to replace spaces with underscores
	const name = isRawFolder(item) ? normalizeFolderName(rawName) : rawName;
	if (!parentUid) {
		return name;
	}

	const parent = byUid.get(parentUid);

	if (!parent) {
		throw new Error(`Parent UID not found: ${parentUid}`);
	}

	const parentPath = resolveItemPath(byUid, parent);

	// Do not use `path.join` here because we depend on a consistent path
	// separator across all platforms. `name` is already known to be a pure
	// filename and will not contain any path separators.
	return `${parentPath}/${name}`;
}
