import type Client from '#cli/cs/api/Client.js';
import deleteLabel from '#cli/cs/labels/delete.js';
import importLabel from '#cli/cs/labels/import.js';
import type Label from '#cli/cs/labels/Label.js';
import updateLabel from '#cli/cs/labels/update.js';
import type NormalizedLabel from '#cli/dto/label/NormalizedLabel.js';
import toCs from '#cli/dto/label/toCs.js';
import type LabelCollection from './LabelCollection.js';

export default class CsLabelCollection implements LabelCollection {
	readonly #labels: Map<Label['name'], NormalizedLabel>;
	readonly #uidByName: Map<Label['name'], Label['uid']>;

	public constructor(
		private readonly client: Client,
		labels: ReadonlyMap<Label['name'], NormalizedLabel>,
		uidByName: ReadonlyMap<Label['name'], Label['uid']>,
	) {
		this.#labels = new Map(labels);
		this.#uidByName = new Map(uidByName);
	}

	public get byName(): ReadonlyMap<Label['name'], NormalizedLabel> {
		return this.#labels;
	}

	public async create(normalized: NormalizedLabel): Promise<void> {
		const labelWithoutUid = toCs(normalized, this.#uidByName);
		const uid = await importLabel(this.client, labelWithoutUid);
		this.#labels.set(normalized.label.name, normalized);
		this.#uidByName.set(normalized.label.name, uid);
	}

	public async remove(normalized: NormalizedLabel): Promise<void> {
		const uid = this.#uidByName.get(normalized.label.name);

		if (!uid) {
			throw new Error(`Label ${normalized.label.name} UID not found`);
		}

		await deleteLabel(this.client, uid);
		this.#labels.delete(normalized.label.name);
		this.#uidByName.delete(normalized.label.name);
	}

	public async update(normalized: NormalizedLabel): Promise<void> {
		const existing = this.#labels.get(normalized.label.name);

		if (!existing) {
			throw new Error(`Label ${normalized.label.name} does not exist`);
		}

		const uid = this.#uidByName.get(normalized.label.name);

		if (!uid) {
			throw new Error(`Label ${normalized.label.name} UID not found`);
		}

		const labelWithUid = toCs(normalized, this.#uidByName, uid) as Label;
		await updateLabel(this.client, labelWithUid);

		this.#labels.set(normalized.label.name, normalized);
	}
}
