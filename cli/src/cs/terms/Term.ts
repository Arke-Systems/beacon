import type OmitIndex from '../../util/OmitIndex.js';
import type { Item } from '../Types.js';
import { isItem } from '../Types.js';

export default interface Term extends OmitIndex<Item> {
	readonly name: string;
	readonly parent_uid: string | null;
}

export function isTerm(o: unknown): o is Term {
	return (
		isItem(o) &&
		typeof o.name === 'string' &&
		(o.parent_uid === null || typeof o.parent_uid === 'string')
	);
}
