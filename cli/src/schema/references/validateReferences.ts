import type Client from '#cli/cs/api/Client.js';
import type Ctx from '../ctx/Ctx.js';
import type { ValidationReport } from './InvalidReference.js';
import {
	calculateSummary,
	collectInvalidReferences,
	countEntriesWithIssues,
	countTotalEntries,
} from './lib/validationHelpers.js';
import type { ReferenceValidatorContext } from './ReferenceValidator.js';

/**
 * Validates all references in Contentstack entries and generates a report
 * of invalid references.
 *
 * This is a read-only operation that does not modify any data.
 *
 * @param client - The Contentstack API client
 * @returns A validation report with all invalid references found
 */
export async function validateReferences(
	client: Client,
): Promise<ValidationReport> {
	// Prepare context by loading all data from Contentstack
	const ctx = await import('../ctx/Ctx.js').then(async (m) =>
		m.default.prepare(client),
	);

	return validateReferencesFromContext(ctx);
}

/**
 * Validates references using an existing context.
 * Useful for testing or when context is already available.
 */
export function validateReferencesFromContext(ctx: Ctx): ValidationReport {
	const validationCtx: ReferenceValidatorContext = {
		assets: {
			has: (uid: string) => ctx.cs.assets.byUid.has(uid),
		},
		contentTypes: ctx.cs.contentTypes,
		entries: {
			byTypedUid: ctx.cs.entries.byTypedUid,
		},
	};

	const invalidReferences = collectInvalidReferences(ctx, validationCtx);
	const summary = calculateSummary(invalidReferences);
	const entriesWithIssues = countEntriesWithIssues(invalidReferences);
	const totalEntriesChecked = countTotalEntries(ctx);

	return {
		entriesWithIssues,
		invalidReferences,
		summary,
		totalEntriesChecked,
	};
}
