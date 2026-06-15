import type { Item } from '../Types.js';
import { isItem } from '../Types.js';

export default interface Label extends Item {
	readonly name: string;
	readonly parent?: readonly string[];
	readonly content_types?: readonly string[];
}

export function isLabel(o: unknown): o is Label {
	return (
		isItem(o) &&
		typeof o.name === 'string' &&
		(!('parent' in o) ||
			o.parent === undefined ||
			(Array.isArray(o.parent) &&
				o.parent.every((x) => typeof x === 'string'))) &&
		(!('content_types' in o) ||
			o.content_types === undefined ||
			(Array.isArray(o.content_types) &&
				o.content_types.every((x) => typeof x === 'string')))
	);
}

export function key(o: Label) {
	return o.uid;
}
