import type { RawAssetItem } from '#cli/cs/assets/Types.js';
import type { ReferencePath } from '#cli/cs/entries/Types.js';
import type { SchemaField } from '#cli/cs/Types.js';
import resolveItemPath from '#cli/schema/assets/lib/resolveItemPath.js';
import type Ctx from '#cli/schema/ctx/Ctx.js';
import getUi from '#cli/schema/lib/SchemaUi.js';
import createStylus from '#cli/ui/createStylus.js';
import isHtmlRteField from './isHtmlRteField.js';
import type Replacer from './Replacer.js';

export default class HtmlRteReplacer implements Replacer {
	readonly #assetsByUid: ReadonlyMap<string, RawAssetItem>;
	readonly #refPath: ReferencePath;

	public constructor(ctx: Ctx, refPath: ReferencePath) {
		this.#assetsByUid = ctx.cs.assets.byUid;
		this.#refPath = refPath;
	}

	public process(schema: SchemaField, value: unknown) {
		if (!isHtmlRteField(schema) || typeof value !== 'string') {
			return value;
		}

		return this.#replaceAssetReferences(value);
	}

	#replaceAssetReferences(html: string): string {
		let result = html;
		result = this.#replaceAssetUidReferences(result);
		result = this.#replaceSrcReferences(result);
		return result;
	}

	#replaceAssetUidReferences(html: string): string {
		// Match img tags with asset_uid attribute
		// Pattern: <img ... asset_uid="blt..." ... >
		const assetUidPattern =
			/<img\s+(?<beforeAttrs>[^>]*\s+)?asset_uid="(?<assetUid>[^"]+)"(?<afterAttrs>[^>]*)>/giu;

		return html.replace(
			assetUidPattern,
			(
				_match,
				beforeAttrs: string | undefined,
				assetUid: string,
				afterAttrs: string | undefined,
			) => {
				const asset = this.#assetsByUid.get(assetUid);

				if (!asset) {
					this.#warnUnknownAsset(assetUid, 'HTML');
					return _match;
				}

				const itemPath = resolveItemPath(this.#assetsByUid, asset);

				// Remove the asset_uid attribute and src attribute if present
				// and replace with $beacon reference
				let attrs = (beforeAttrs ?? '') + (afterAttrs ?? '');

				// Remove src attribute that contains contentstack.io
				attrs = attrs.replace(/\s*src="[^"]*contentstack\.io[^"]*"/giu, '');

				// Trim any extra whitespace
				attrs = attrs.trim();

				// Build new img tag with $beacon reference
				const beaconSrc = `{asset: $beacon: '${itemPath}'}`;
				return `<img src="${beaconSrc}"${attrs ? ' ' + attrs : ''}>`;
			},
		);
	}

	#replaceSrcReferences(html: string): string {
		// Match contentstack.io URLs in src attributes without asset_uid
		// Pattern: src="https://images.contentstack.io/v3/assets/{api_key}/{asset_uid}/..."
		const srcPattern =
			/src="https:\/\/images\.contentstack\.io\/v3\/assets\/[^/]+\/(?<assetUid>[^/]+)\/[^"]*"/giu;

		return html.replace(srcPattern, (_match, assetUid: string) => {
			const asset = this.#assetsByUid.get(assetUid);

			if (!asset) {
				this.#warnUnknownAsset(assetUid, 'HTML URL');
				return _match;
			}

			const itemPath = resolveItemPath(this.#assetsByUid, asset);
			return `src="{asset: $beacon: '${itemPath}'}"`;
		});
	}

	#warnUnknownAsset(assetUid: string, context: string): void {
		const y = createStylus('yellowBright');
		const msg1 = y`Entry ${this.#refPath} references an unknown asset in ${context}:`;
		const msg2 = y`${assetUid}.`;
		getUi().warn(msg1, msg2);
	}
}
