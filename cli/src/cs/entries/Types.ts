import type { ContentType } from '../content-types/Types.js';
import type { Item } from '../Types.js';
import { isItem } from '../Types.js';

export interface Entry extends Item {
	readonly title: string;
}

export function isEntry(o: unknown): o is Entry {
	return isItem(o) && typeof o.title === 'string';
}

export function key(o: Entry) {
	return o.title;
}

export type ReferencePath = `${ContentType['uid']}/${Entry['title']}`;

export function isReferencePath(value: unknown): value is ReferencePath {
	return typeof value === 'string' && value.includes('/');
}
