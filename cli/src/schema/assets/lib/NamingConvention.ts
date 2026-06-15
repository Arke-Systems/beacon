import type { SerializationFormat } from '#cli/ui/Options.js';
import type { Dirent } from 'node:fs';
import path from 'node:path';
import normalizeFolderName from './normalizeFolderName.js';

export function getBlobPath(absPathToOriginalFile: string): string;
export function getBlobPath(assetsPath: string, itemPath: string): string;
export function getBlobPath(
	assetsPathOrAbsPath: string,
	itemPath?: string,
): string {
	const absPath =
		typeof itemPath === 'string'
			? path.resolve(assetsPathOrAbsPath, itemPath)
			: assetsPathOrAbsPath;

	const ext = path.extname(absPath);
	const baseName = path.basename(absPath, ext);
	return path.resolve(path.dirname(absPath), `${baseName}.blob${ext}`);
}

export function getMetaPath(
	assetsPath: string,
	itemPath: string,
	format: SerializationFormat = 'yaml',
) {
	const absPath = path.resolve(assetsPath, itemPath);
	const ext = path.extname(absPath);
	const baseName = path.basename(absPath, ext);
	const metaExt = format === 'json' ? '.json' : '.yaml';
	return path.join(path.dirname(absPath), `${baseName}.meta${ext}${metaExt}`);
}

export function getItemPath(assetsPath: string, absPath: string) {
	// absPath supported input formats:
	//   /full/schema/path/assets/whatever/some-file.blob.webp
	//   /full/schema/path/assets/whatever/some-file.meta.webp.yaml
	//   /full/schema/path/assets/whatever/some-file.meta.webp.json
	//
	// Expected output format:
	//   whatever/some-file.webp

	const ext1 = path.extname(absPath);
	const stripFirstExt = path.basename(absPath, ext1);
	const ext2 = path.extname(stripFirstExt);
	const stripSecondExt = path.basename(stripFirstExt, ext2);
	const dirname = path.dirname(absPath);

	if (ext2 === '.blob') {
		const originalPath = path.resolve(dirname, `${stripSecondExt}${ext1}`);
		return formatItemPath(assetsPath, originalPath);
	}

	const ext3 = path.extname(stripSecondExt);

	if ((ext1 === '.yaml' || ext1 === '.json') && ext3 === '.meta') {
		const stripThirdExt = path.basename(stripSecondExt, ext3);
		const originalPath = path.resolve(dirname, `${stripThirdExt}${ext2}`);
		return formatItemPath(assetsPath, originalPath);
	}

	throw new Error(`Invalid asset path: ${absPath}`);
}

export function* assetPaths(assetsPath: string, files: Iterable<Dirent>) {
	for (const file of files) {
		if (!file.isFile()) {
			continue;
		}

		const ext = path.extname(file.name);
		if (ext !== '.yaml' && ext !== '.json') {
			continue;
		}

		const stripMetaExt = path.basename(file.name, ext);
		const originalExt = path.extname(stripMetaExt);
		const stripOriginalExt = path.basename(stripMetaExt, originalExt);
		const metaExt = path.extname(stripOriginalExt);

		if (metaExt !== '.meta') {
			continue;
		}

		const orgBaseName = path.basename(stripOriginalExt, metaExt);
		const orgName = `${orgBaseName}${originalExt}`;
		const originalPath = path.resolve(file.parentPath, orgName);
		const blobName = `${orgBaseName}.blob${originalExt}`;
		const rawItemPath = formatItemPath(assetsPath, originalPath);
		// Normalize folder names in path to replace spaces with underscores
		const itemPath = rawItemPath
			.split('/')
			.map((segment, index, array) => {
				// Only normalize folder segments, not the filename (last segment)
				return index < array.length - 1
					? normalizeFolderName(segment)
					: segment;
			})
			.join('/');

		yield {
			blobPath: path.resolve(file.parentPath, blobName),
			itemPath,
			metaPath: path.resolve(file.parentPath, file.name),
		};
	}
}

export function formatItemPath(assetsPath: string, itemPath: string) {
	const result = path.relative(assetsPath, itemPath);
	return path.sep === '/' ? result : result.replaceAll(path.sep, '/');
}
