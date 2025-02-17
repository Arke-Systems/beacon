import type { Item } from '../Types.js';
import { isItem } from '../Types.js';

export default interface Taxonomy extends Item {
	readonly name: string;
	readonly description: string;
}

export function isTaxonomy(o: unknown): o is Taxonomy {
	return (
		isItem(o) && typeof o.name === 'string' && typeof o.description === 'string'
	);
}

export function key(o: Taxonomy) {
	return o.uid;
}
