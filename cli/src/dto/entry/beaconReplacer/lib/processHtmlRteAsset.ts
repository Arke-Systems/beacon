import { isReferencePath } from '#cli/cs/entries/Types.js';
import parseReferencePath from '#cli/cs/entries/parseReferencePath.js';
import type BeaconReplacer from '../../BeaconReplacer.js';

export default function processHtmlRteAsset(
	this: BeaconReplacer,
	html: string,
): string {
	// First, handle asset references: src="{asset: $beacon: 'path/to/asset.jpg'}"
	const assetPattern = /src="\{asset:\s*\$beacon:\s*'(?<itemPath>[^']+)'\}"/gu;

	let result = html.replace(assetPattern, (match) => {
		const execResult =
			/src="\{asset:\s*\$beacon:\s*'(?<itemPath>[^']+)'\}"/u.exec(match);
		const itemPath = execResult?.groups?.itemPath;
		if (!itemPath) {
			return match;
		}
		const asset = this.mapItemPathToAsset(itemPath);

		// Return both asset_uid and src attributes for Contentstack compatibility
		// Use the asset's URL directly from Contentstack
		return `asset_uid="${asset.uid}" src="${asset.url}"`;
	});

	// Second, handle entry references: href="$beacon: content_type/entry_title"
	const entryPattern = /href="\$beacon:\s*(?<refPath>[^"]+)"/gu;

	result = result.replace(entryPattern, (match) => {
		const execResult = /href="\$beacon:\s*(?<refPath>[^"]+)"/u.exec(match);
		const refPath = execResult?.groups?.refPath;
		if (!refPath || !isReferencePath(refPath)) {
			return match;
		}

		if (!this.refPath) {
			throw new Error('No reference path context for entry reference.');
		}

		const { contentTypeUid } = parseReferencePath(refPath);
		const entryUid = this.ctx.references.findReferencedUid(
			this.refPath,
			refPath,
		);

		// Get the locale from the current entry context
		// If locale is not available, use 'en-us' as fallback for backward compatibility
		const { locale: currentLocale } = this;
		const locale = typeof currentLocale === 'string' ? currentLocale : 'en-us';

		// Use Contentstack's HTML RTE entry reference format
		// Must include data-sys-entry-uid, data-sys-content-type-uid, data-sys-entry-locale, sys-style-type, type, and class
		return `data-sys-entry-uid="${entryUid}" data-sys-content-type-uid="${contentTypeUid}" data-sys-entry-locale="${locale}" sys-style-type="link" type="entry" class="embedded-entry" href=""`;
	});

	return result;
}
