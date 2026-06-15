import type { ReferencePath } from '#cli/cs/entries/Types.js';
import EntryWalker from '#cli/cs/entryWalker/EntryWalker.js';
import type Ctx from '../../ctx/Ctx.js';
import type {
	InvalidReference,
	ValidationReport,
} from '../InvalidReference.js';
import ReferenceValidator, {
	type ReferenceValidatorContext,
} from '../ReferenceValidator.js';

export function collectInvalidReferences(
	ctx: Ctx,
	validationCtx: ReferenceValidatorContext,
): InvalidReference[] {
	const invalidReferences: InvalidReference[] = [];

	// Iterate through all content types and their entries
	for (const [contentTypeUid, contentType] of ctx.cs.contentTypes) {
		const entries = ctx.cs.entries.byTitleFor(contentTypeUid);

		for (const [title, entry] of entries) {
			const entryPath: ReferencePath = `${contentTypeUid}/${title}`;
			const validator = new ReferenceValidator(validationCtx, entryPath);

			const walker = new EntryWalker(
				ctx.cs.globalFields,
				entryPath,
				validator.process,
			);

			// Walk the entry to validate all references
			walker.process(contentType.schema, entry);

			invalidReferences.push(...validator.invalidReferences);
		}
	}

	return invalidReferences;
}

export function calculateSummary(
	invalidReferences: readonly InvalidReference[],
): ValidationReport['summary'] {
	const summary: Record<InvalidReference['issueType'], number> = {
		'invalid-structure': 0,
		'missing-asset': 0,
		'missing-content-type': 0,
		'missing-entry': 0,
	};

	for (const ref of invalidReferences) {
		summary[ref.issueType]++;
	}

	return summary as ValidationReport['summary'];
}

export function countEntriesWithIssues(
	invalidReferences: readonly InvalidReference[],
): number {
	return new Set(invalidReferences.map((ref) => ref.fromEntry)).size;
}

export function countTotalEntries(ctx: Ctx): number {
	let total = 0;
	for (const [contentTypeUid] of ctx.cs.contentTypes) {
		const entries = ctx.cs.entries.byTitleFor(contentTypeUid);
		total += entries.size;
	}
	return total;
}
