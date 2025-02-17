import type { RawAssetItem } from '#cli/cs/assets/Types.js';
import type { ReferencePath } from '#cli/cs/entries/Types.js';
import type { SchemaField } from '#cli/cs/Types.js';
import { isItem } from '#cli/cs/Types.js';
import resolveItemPath from '#cli/schema/assets/lib/resolveItemPath.js';
import type Ctx from '#cli/schema/ctx/Ctx.js';
import getUi from '#cli/schema/lib/SchemaUi.js';
import createStylus from '#cli/ui/createStylus.js';

export default class AssetReplacer {
	readonly #assetsByUid: ReadonlyMap<string, RawAssetItem>;
	readonly #refPath: ReferencePath;

	public constructor(ctx: Ctx, refPath: ReferencePath) {
		this.#assetsByUid = ctx.cs.assets.byUid;
		this.#refPath = refPath;
	}

	public process(schema: SchemaField, value: unknown) {
		if (schema.data_type !== 'file') {
			return value;
		}

		return schema.multiple
			? this.#replaceAssets(value)
			: this.#replaceAsset(value);
	}

	#replaceAssets(value: unknown) {
		if (value === null || value === undefined) {
			return value;
		}

		if (!Array.isArray(value)) {
			const y = createStylus('yellowBright');
			const msg1 = y`Expected an array of assets in entry ${this.#refPath},`;
			const msg2 = y`but found [${typeof value}]:`;
			getUi().warn(msg1, msg2, value);
			return value;
		}

		return value.map(this.#replaceAsset.bind(this)).filter(Boolean);
	}

	#replaceAsset(value: unknown) {
		if (value === null || value === undefined) {
			return value;
		}

		if (!isItem(value)) {
			const y = createStylus('yellowBright');
			const msg = y`Entry ${this.#refPath} references an invalid asset:`;
			getUi().warn(msg, value);
			return value;
		}

		const asset = this.#assetsByUid.get(value.uid);

		if (!asset) {
			const y = createStylus('yellowBright');
			const msg1 = y`Entry ${this.#refPath} references an unknown asset:`;
			const msg2 = y`${value.uid}.`;
			getUi().warn(msg1, msg2);
			return value;
		}

		const itemPath = resolveItemPath(this.#assetsByUid, asset);

		return { $beacon: { asset: itemPath } };
	}
}
