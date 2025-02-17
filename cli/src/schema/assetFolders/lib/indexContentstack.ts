import type { ReadonlyAssets } from '#cli/cs/assets/Assets.js';
import { isRawFolder, type RawFolder } from '#cli/cs/assets/Types.js';
import type FolderMeta from './FolderMeta.js';

export default function indexContentstack(assets: ReadonlyAssets) {
	const result = new Map<string, FolderMeta>();

	for (const folder of readFolders(assets, null, '')) {
		result.set(folder.itemPath, folder);
	}

	return result;
}

function* readFolders(
	assets: ReadonlyAssets,
	parentUid: RawFolder['parent_uid'],
	contextPath: string,
): Generator<FolderMeta> {
	const contents = assets.byParentUid.get(parentUid);
	if (!contents) {
		return;
	}

	for (const entry of contents) {
		if (!isRawFolder(entry)) {
			continue;
		}

		const itemPath = contextPath ? `${contextPath}/${entry.name}` : entry.name;
		yield { itemPath, name: entry.name };
		yield* readFolders(assets, entry.uid, itemPath);
	}
}
