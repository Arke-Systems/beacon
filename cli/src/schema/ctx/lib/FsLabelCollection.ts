import type Label from '#cli/cs/labels/Label.js';
import type NormalizedLabel from '#cli/dto/label/NormalizedLabel.js';
import { getFileExtension } from '#cli/fs/serializationFormat.js';
import writeSerializedData from '#cli/fs/writeSerializedData.js';
import getUi from '#cli/schema/lib/SchemaUi.js';
import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import schemaDirectory from '../../labels/schemaDirectory.js';
import type LabelCollection from './LabelCollection.js';

export default class FsLabelCollection implements LabelCollection {
	readonly #directory = schemaDirectory();
	readonly #labels: Map<Label['name'], NormalizedLabel>;

	public constructor(labels: ReadonlyMap<Label['name'], NormalizedLabel>) {
		this.#labels = new Map(labels);
	}

	public get byName(): ReadonlyMap<Label['name'], NormalizedLabel> {
		return this.#labels;
	}

	public async create(normalized: NormalizedLabel): Promise<void> {
		await this.#write(normalized);
		this.#labels.set(normalized.label.name, normalized);
	}

	public async remove(normalized: NormalizedLabel): Promise<void> {
		await rm(this.#getPath(normalized.label.name), { force: true });
		this.#labels.delete(normalized.label.name);
	}

	public async update(normalized: NormalizedLabel): Promise<void> {
		await this.#write(normalized);
		this.#labels.set(normalized.label.name, normalized);
	}

	async #write(normalized: NormalizedLabel) {
		const ui = getUi();
		const format = ui.options.schema.serializationFormat;
		const path = this.#getPath(normalized.label.name);
		return writeSerializedData(path, normalized, format, {
			sortMapEntries: false,
		});
	}

	#getPath(name: string) {
		const ui = getUi();
		const format = ui.options.schema.serializationFormat;
		// Sanitize the name for use as a filename
		const safeName = name.replace(/[^a-z0-9_-]/giu, '_').toLowerCase();
		return resolve(this.#directory, `${safeName}${getFileExtension(format)}`);
	}
}
