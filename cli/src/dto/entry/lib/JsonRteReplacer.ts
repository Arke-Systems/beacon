import type { RawAssetItem } from '#cli/cs/assets/Types.js';
import type { ReferencePath } from '#cli/cs/entries/Types.js';
import type { SchemaField } from '#cli/cs/Types.js';
import resolveItemPath from '#cli/schema/assets/lib/resolveItemPath.js';
import type Ctx from '#cli/schema/ctx/Ctx.js';
import getUi from '#cli/schema/lib/SchemaUi.js';
import createStylus from '#cli/ui/createStylus.js';
import isRecord from '#cli/util/isRecord.js';
import { inspect } from 'node:util';
import type Replacer from './Replacer.js';

export default class JsonRteReplacer implements Replacer {
	readonly #assetsByUid: ReadonlyMap<string, RawAssetItem>;
	readonly #refPath: ReferencePath;

	public constructor(ctx: Ctx, refPath: ReferencePath) {
		this.#assetsByUid = ctx.cs.assets.byUid;
		this.#refPath = refPath;
	}

	public process(schema: SchemaField, value: unknown) {
		if (!isJsonRteField(schema) || !isRecord(value)) {
			return value;
		}

		const { _version, ...node } = value;

		return this.#processNode(node);
	}

	#processNode({
		uid,
		...node
	}: Record<string, unknown>): Record<string, unknown> {
		const { children } = node;

		this.#mutateReferenceNode(node);

		if (Array.isArray(children)) {
			node.children = children.map((child) =>
				isRecord(child) ? this.#processNode(child) : (child as unknown),
			);
		}

		return node;
	}

	#mutateReferenceNode(node: Record<string, unknown>) {
		if (node.type !== 'reference') {
			return;
		}

		const { attrs } = node;
		if (!isRecord(attrs)) {
			return;
		}

		const { 'content-type-uid': contentTypeUid, 'asset-uid': assetUid } = attrs;
		if (contentTypeUid === 'sys_assets' && typeof assetUid === 'string') {
			this.#mutateAssetNode(attrs, assetUid);
			return;
		}

		const y = createStylus('yellowBright');
		const msg1 = y`Entry ${this.#refPath} has an unhandled reference:`;
		const msg2 = inspect(attrs, { colors: true });
		getUi().warn(msg1, msg2);
	}

	#mutateAssetNode(attrs: Record<string, unknown>, assetUid: string) {
		const asset = this.#assetsByUid.get(assetUid);

		if (!asset) {
			const y = createStylus('yellowBright');
			const msg1 = y`Entry ${this.#refPath} references an unknown asset:`;
			const msg2 = y`${assetUid}.`;
			getUi().warn(msg1, msg2);
			return;
		}

		const itemPath = resolveItemPath(this.#assetsByUid, asset);
		delete attrs['content-type-uid'];
		delete attrs['asset-uid'];
		attrs.$beacon = { jsonRteAsset: itemPath };
	}
}

function isJsonRteField(schema: SchemaField) {
	if (schema.data_type !== 'json') {
		return false;
	}

	if ('extension_uid' in schema) {
		return false;
	}

	const metadata = schema.field_metadata;
	if (!isRecord(metadata)) {
		return false;
	}

	return Boolean(metadata.allow_json_rte);
}
