import type { Entry } from '#cli/cs/entries/Types.js';
import { isDeepStrictEqual } from 'node:util';
import normalize from './lib/normalize.js';

export default function equality(a: Entry, b: Entry) {
	return isDeepStrictEqual(normalize(a), normalize(b));
}
