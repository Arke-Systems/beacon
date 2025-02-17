import type NormalizedTaxonomy from '#cli/dto/taxonomy/NormalizedTaxonomy.js';
import { isDeepStrictEqual } from 'node:util';

export default function equality(a: NormalizedTaxonomy, b: NormalizedTaxonomy) {
	return isDeepStrictEqual(a.taxonomy, b.taxonomy);
}
