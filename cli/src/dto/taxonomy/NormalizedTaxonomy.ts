import type Taxonomy from '#cli/cs/taxonomies/Taxonomy.js';
import type Term from '#cli/cs/terms/Term.js';
import { isItem } from '#cli/cs/Types.js';
import isRecord from '#cli/util/isRecord.js';

export default interface NormalizedTaxonomy {
	readonly taxonomy: {
		readonly description?: Taxonomy['description'];
		readonly name: Taxonomy['name'];
		readonly uid: Taxonomy['uid'];
	};
	readonly terms?: readonly TermTreeNode[];
}

export interface TermTreeNode {
	readonly uid: Term['uid'];
	readonly name: Term['name'];
	readonly children?: readonly TermTreeNode[];
}

export function key(o: NormalizedTaxonomy) {
	return o.taxonomy.uid;
}

export function isNormalizedTaxonomy(
	value: unknown,
): value is NormalizedTaxonomy & Record<string, unknown> {
	if (!isRecord(value)) {
		return false;
	}

	return (
		isTaxonomy(value.taxonomy) &&
		(value.terms === undefined ||
			(Array.isArray(value.terms) && value.terms.every(isTermTreeNode)))
	);
}

function isTaxonomy(x: unknown): x is NormalizedTaxonomy['taxonomy'] {
	return (
		isRecord(x) &&
		typeof x.name === 'string' &&
		typeof x.uid === 'string' &&
		(!('description' in x) || typeof x.description === 'string')
	);
}

function isTermTreeNode(value: unknown): value is TermTreeNode {
	if (!isItem(value)) {
		return false;
	}

	if (typeof value.name !== 'string') {
		return false;
	}

	if (!('children' in value)) {
		return true;
	}

	const { children } = value;

	return Array.isArray(children) && children.every(isTermTreeNode);
}
