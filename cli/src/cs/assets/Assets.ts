import type Client from '../api/Client.js';
import createAsset from './create.js';
import createFolder from './createFolder.js';
import deleteAsset from './delete.js';
import deleteFolder from './deleteFolder.js';
import indexByParent from './lib/indexByParent.js';
import resolveRawAssetItem from './lib/resolveRawAssetItem.js';
import type { RawAsset, RawAssetItem, RawFolder } from './Types.js';
import { isRawAsset } from './Types.js';

export interface ReadonlyAssets {
	readonly byUid: ReadonlyMap<RawAssetItem['uid'], RawAssetItem>;

	readonly byParentUid: ReadonlyMap<
		RawAssetItem['parent_uid'],
		ReadonlySet<RawAssetItem>
	>;

	descendant(uid: RawAssetItem['parent_uid']): Generator<RawAssetItem>;
	descendantOrSelf(uid: RawAssetItem['parent_uid']): Generator<RawAssetItem>;
}

export default class Assets implements ReadonlyAssets {
	readonly #byUid: Map<RawAssetItem['uid'], RawAssetItem>;

	readonly #byParentUid: Map<RawAssetItem['parent_uid'], Set<RawAssetItem>>;

	public constructor(
		private readonly client: Client,
		initialByUid: ReadonlyMap<RawAssetItem['uid'], RawAssetItem>,
	) {
		this.#byUid = new Map(initialByUid);
		const byParent = indexByParent(initialByUid);
		this.#byParentUid = new Map([...byParent].map(([k, v]) => [k, new Set(v)]));
	}

	public get byUid(): ReadonlyMap<RawAssetItem['uid'], RawAssetItem> {
		return this.#byUid;
	}

	public get byParentUid(): ReadonlyMap<
		RawAssetItem['parent_uid'],
		ReadonlySet<RawAssetItem>
	> {
		return this.#byParentUid;
	}

	async createAsset(
		newAsset: Parameters<typeof createAsset>[1],
	): Promise<RawAsset> {
		const created = await createAsset(this.client, newAsset);
		this.#byUid.set(created.uid, created);

		const { parent_uid: parentUid } = created;
		if (parentUid) {
			const parent = this.#byParentUid.get(parentUid);
			if (!parent) {
				throw new Error('Parent folder not found');
			}

			parent.add(created);
		} else {
			const parent = this.#byParentUid.get(null);

			if (parent) {
				parent.add(created);
			} else {
				this.#byParentUid.set(null, new Set([created]));
			}
		}

		return created;
	}

	async createFolder(
		name: RawFolder['name'],
		parentUid: RawFolder['parent_uid'],
	): Promise<RawAssetItem> {
		const created = await createFolder(this.client, name, parentUid);

		const parent = this.#byParentUid.get(parentUid);
		if (parentUid) {
			if (!parent) {
				throw new Error('Parent folder not found');
			}

			parent.add(created);
		} else if (parent) {
			parent.add(created);
		} else {
			this.#byParentUid.set(null, new Set([created]));
		}

		this.#byUid.set(created.uid, created);
		this.#byParentUid.set(created.uid, new Set());
		return created;
	}

	async deleteAsset(itemPath: string) {
		const item = resolveRawAssetItem(this.#byParentUid, itemPath);

		if (!item || !isRawAsset(item)) {
			throw new Error(`Item not found: ${itemPath}`);
		}

		const { parent_uid: parentUid, uid } = item;

		await deleteAsset(this.client, uid);
		this.#byUid.delete(uid);

		const siblings = this.#byParentUid.get(parentUid);
		if (!siblings) {
			throw new Error('Parent folder not found');
		}

		siblings.delete(item);

		if (siblings.size === 0 && parentUid) {
			await this.deleteFolder(parentUid);
		}
	}

	async deleteFolder(uid: RawFolder['uid']) {
		await deleteFolder(this.client, uid);

		[...this.descendantOrSelf(uid)].forEach((item) => {
			this.#byUid.delete(item.uid);
			this.#byParentUid.delete(uid);
		});
	}

	*descendantOrSelf(uid: RawAssetItem['parent_uid']): Generator<RawAssetItem> {
		yield* this.descendant(uid);

		const self = uid ? this.#byUid.get(uid) : undefined;
		if (self) {
			yield self;
		}
	}

	*descendant(uid: RawAssetItem['parent_uid']): Generator<RawAssetItem> {
		const children = this.#byParentUid.get(uid);

		for (const child of children ?? []) {
			if (isRawAsset(child)) {
				yield child;
			} else {
				yield* this.descendantOrSelf(child.uid);
			}
		}
	}
}
