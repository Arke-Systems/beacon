import type { Schema } from '#cli/cs/Types.js';
import getUi from '#cli/schema/lib/SchemaUi.js';
import isRecord from '#cli/util/isRecord.js';
import { inspect } from 'node:util';

export default function toCs(schema: Schema): Schema {
	return processObject(schema) as unknown as Schema;
}

function processObject(o: Record<string, unknown>): Record<string, unknown> {
	return Object.fromEntries(
		Object.entries(o).map(([key, value]) => [key, processValue(value)]),
	);
}

function processValue(value: unknown): unknown {
	if (Array.isArray(value)) {
		return value.map(processValue);
	}

	if (isRecord(value)) {
		const { $beacon } = value;
		if (!isRecord($beacon)) {
			return processObject(value);
		}

		const uid =
			resolveUid($beacon, 'extension') ?? resolveUid($beacon, 'jsonRtePlugin');

		if (typeof uid !== 'string') {
			throw new Error('Invalid $beacon in ' + inspect(value, { depth: 2 }));
		}

		return uid;
	}

	return value;
}

function resolveUid(
	$beacon: Record<string, unknown>,
	property: 'extension' | 'jsonRtePlugin',
) {
	const name = $beacon[property];

	if (typeof name !== 'string') {
		return;
	}

	const { options } = getUi();

	const uid = options.schema[property].byName.get(name);

	if (typeof uid !== 'string') {
		throw new Error(`Could not find UID for extension ${name}.`);
	}

	return uid;
}
