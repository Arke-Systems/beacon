import type Client from '#cli/cs/api/Client.js';
import type Term from '#cli/cs/terms/Term.js';
import flatten from '#cli/dto/taxonomy/flatten.js';
import type NormalizedTaxonomy from '#cli/dto/taxonomy/NormalizedTaxonomy.js';
import create from './lib/create.js';
import descendants from './lib/descendants.js';
import getRequired from './lib/getRequired.js';
import { getSiblingContext } from './lib/getSiblingContext.js';
import insertTermIntoSiblings from './lib/insertTermIntoSiblings.js';
import move from './lib/move.js';
import type MutableTerm from './lib/MutableTerm.js';
import remove from './lib/remove.js';
import update from './lib/update.js';

export default class Collection {
	public readonly remove: typeof remove;
	public readonly create: typeof create;
	public readonly update: typeof update;
	public readonly move: typeof move;

	protected readonly byParentUid = new Map<string | null, MutableTerm[]>();
	protected readonly byUid = new Map<string, MutableTerm>();
	protected readonly descendants: typeof descendants;
	protected readonly getRequired: typeof getRequired;
	protected readonly getSiblingContext: typeof getSiblingContext;
	protected readonly insertTermIntoSiblings: typeof insertTermIntoSiblings;
	protected readonly taxonomy: NormalizedTaxonomy['taxonomy'];

	public constructor(
		protected readonly client: Client,
		normalized: NormalizedTaxonomy,
	) {
		this.descendants = descendants.bind(this);
		this.insertTermIntoSiblings = insertTermIntoSiblings.bind(this);
		this.getRequired = getRequired.bind(this);
		this.getSiblingContext = getSiblingContext.bind(this);
		this.remove = remove.bind(this);
		this.create = create.bind(this);
		this.update = update.bind(this);
		this.move = move.bind(this);

		this.taxonomy = normalized.taxonomy;
		const flat = flatten(normalized.terms ?? []);

		for (const term of flat) {
			this.byUid.set(term.uid, term);

			const existing = this.byParentUid.get(term.parent_uid);
			if (existing) {
				existing.push(term);
			} else {
				this.byParentUid.set(term.parent_uid, [term]);
			}
		}
	}

	public *all(this: Collection): Generator<Term> {
		for (const term of this.byUid.values()) {
			yield term;
		}
	}

	public children(parentUid: string | null): readonly Term[] {
		return this.byParentUid.get(parentUid) ?? [];
	}

	public get(termUid: string): Term | undefined {
		return this.byUid.get(termUid);
	}
}
