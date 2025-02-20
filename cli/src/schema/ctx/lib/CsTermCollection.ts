import type Client from '#cli/cs/api/Client.js';
import create from '#cli/cs/terms/create.js';
import move from '#cli/cs/terms/move.js';
import remove from '#cli/cs/terms/remove.js';
import type Term from '#cli/cs/terms/Term.js';
import update from '#cli/cs/terms/update.js';
import flatten from '#cli/dto/taxonomy/flatten.js';
import type NormalizedTaxonomy from '#cli/dto/taxonomy/NormalizedTaxonomy.js';
import type ProgressBar from '../../../ui/progress/ProgressBar.js';
import ProgressReporter from '../../../ui/progress/ProgressReporter.js';
import getUi from '../../lib/SchemaUi.js';
import type TransferResults from '../../xfer/TransferResults.js';
import { MutableTransferResults } from '../../xfer/TransferResults.js';

interface MutableTerm {
	readonly uid: string;
	name: string;
	parent_uid: string | null;
}

export default class CsTermCollection {
	readonly #byUid = new Map<string, MutableTerm>();
	readonly #byParentUid = new Map<string | null, MutableTerm[]>();
	readonly #taxonomy: NormalizedTaxonomy['taxonomy'];

	public constructor(
		private readonly client: Client,
		normalized: NormalizedTaxonomy,
	) {
		this.#taxonomy = normalized.taxonomy;
		const flat = flatten(normalized.terms ?? []);

		for (const term of flat) {
			this.#byUid.set(term.uid, term);

			const existing = this.#byParentUid.get(term.parent_uid);
			if (existing) {
				existing.push(term);
			} else {
				this.#byParentUid.set(term.parent_uid, [term]);
			}
		}
	}

	public *all(): Generator<Term> {
		for (const term of this.#byUid.values()) {
			yield term;
		}
	}

	public *descendants(parentUid: string | null): Generator<Term> {
		const children = this.children(parentUid);

		for (const child of children) {
			yield child;
			yield* this.descendants(child.uid);
		}
	}

	public children(parentUid: string | null): readonly Term[] {
		return this.#byParentUid.get(parentUid) ?? [];
	}

	public get(termUid: string): Term | undefined {
		return this.#byUid.get(termUid);
	}

	public create(
		term: Term,
		idx?: number,
	): (bar: ProgressBar) => Promise<TransferResults> {
		this.#byUid.set(term.uid, term);
		const order = this.#insertTermIntoSiblings(term, idx) + 1;

		return async (bar) => {
			const results = new MutableTransferResults();
			using reporter = new ProgressReporter(bar, 'creating', term.name);

			try {
				await create(this.client, this.#taxonomy.uid, term, order);
				results.created.add(term.uid);
			} catch (ex: unknown) {
				results.errored.set(term.uid, ex);
			} finally {
				reporter.finish('created');
				bar.increment();
			}

			return results;
		};
	}

	public update(
		term: Term,
		name: string,
	): ((bar: ProgressBar) => Promise<TransferResults>) | undefined {
		const existing = this.#getRequired(term.uid);
		if (existing.name === name) {
			return;
		}

		existing.name = name;

		return async (bar) => {
			const results = new MutableTransferResults();
			using reporter = new ProgressReporter(bar, 'updating', term.uid);

			try {
				await update(this.client, this.#taxonomy.uid, term.uid, name);
				results.updated.add(term.uid);
			} catch (ex: unknown) {
				results.errored.set(term.uid, ex);
			} finally {
				reporter.finish('updated');
				bar.increment();
			}

			return results;
		};
	}

	public remove(term: Term): (bar: ProgressBar) => Promise<TransferResults> {
		const existing = this.#getRequired(term.uid);
		const descendants = [...this.descendants(existing.uid)];
		const { siblings, idx } = this.#getSiblingContext(existing);

		this.#byUid.delete(term.uid);
		this.#byParentUid.delete(term.uid);
		siblings.splice(idx, 1);

		for (const descendant of descendants) {
			this.#byUid.delete(descendant.uid);
			this.#byParentUid.delete(descendant.uid);
		}

		return async (bar) => {
			const results = new MutableTransferResults();
			const strategy = getUi().options.schema.deletionStrategy;
			const toDelete = [term, ...descendants].map((d) => d.uid);
			const descendantCount = descendants.length;

			const descendantMsg =
				descendantCount === 0
					? ''
					: descendantCount === 1
						? '1 descendant'
						: `${descendantCount.toLocaleString()} descendants`;

			const msg = [term.name, descendantMsg].filter(Boolean).join(' and ');

			if (strategy === 'delete') {
				using reporter = new ProgressReporter(bar, 'deleting', msg);

				try {
					await remove(this.client, this.#taxonomy.uid, term.uid);
					toDelete.forEach((d) => results.deleted.add(d));
				} catch (ex: unknown) {
					results.errored.set(term.uid, ex);
					// Do we include descendants here as well? They didn't really error.
				} finally {
					reporter.finish('deleted');
					bar.increment();
				}
			}

			if (strategy === 'warn') {
				bar.update({ action: 'skipping', key: `deletion of ${msg}` });
			}

			if (strategy === 'ignore' || strategy === 'warn') {
				results.unmodified.add(term.uid);
				bar.increment();
			}

			return results;
		};
	}

	public move(
		term: Term,
		newParentUid: string | null,
		newIdx?: number,
	): ((bar: ProgressBar) => Promise<TransferResults>) | undefined {
		const existing = this.#getRequired(term.uid);
		if (existing.parent_uid === newParentUid) {
			return;
		}

		const { siblings: oldSiblings, idx: oldIdx } =
			this.#getSiblingContext(existing);

		oldSiblings.splice(oldIdx, 1);
		existing.parent_uid = newParentUid;
		const order = this.#insertTermIntoSiblings(existing, newIdx) + 1;

		return async (bar) => {
			const results = new MutableTransferResults();
			using reporter = new ProgressReporter(bar, 'moving', term.name);

			try {
				await move(
					this.client,
					this.#taxonomy.uid,
					term.uid,
					newParentUid,
					order,
				);

				results.updated.add(term.uid);
			} catch (ex: unknown) {
				results.errored.set(term.uid, ex);
			} finally {
				reporter.finish('moved');
				bar.increment();
			}

			return results;
		};
	}

	#getRequired(uid: Term['uid']) {
		const existing = this.#byUid.get(uid);
		if (!existing) {
			throw new Error(`Term ${uid} not found`);
		}

		return existing;
	}

	#getSiblingContext(term: Term) {
		const siblings = this.#byParentUid.get(term.parent_uid);
		if (!siblings) {
			throw new Error('Parent not found');
		}

		const idx = siblings.findIndex((s) => s.uid === term.uid);
		if (idx === -1) {
			throw new Error('Term not found in parent');
		}

		return { idx, siblings };
	}

	#insertTermIntoSiblings(term: Term, idx?: number) {
		const siblings = this.#byParentUid.get(term.parent_uid);
		if (siblings) {
			if (typeof idx === 'number') {
				siblings.splice(idx, 0, term);
			} else {
				siblings.push(term);
			}
		} else {
			this.#byParentUid.set(term.parent_uid, [term]);
		}

		return typeof idx === 'number' ? idx : (siblings?.length ?? 0);
	}
}
