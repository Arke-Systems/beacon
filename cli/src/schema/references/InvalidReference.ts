import type { ContentType } from '#cli/cs/content-types/Types.js';
import type { ReferencePath } from '#cli/cs/entries/Types.js';

export interface InvalidReference {
	/**
	 * The entry that contains the invalid reference
	 */
	readonly fromEntry: ReferencePath;

	/**
	 * The content type UID that the invalid reference points to
	 */
	readonly toContentTypeUid: ContentType['uid'];

	/**
	 * The entry UID or title that the invalid reference points to
	 */
	readonly toIdentifier: string;

	/**
	 * The field path within the entry where the invalid reference was found
	 */
	readonly fieldPath: string;

	/**
	 * The type of reference issue
	 */
	readonly issueType:
		| 'invalid-structure'
		| 'missing-asset'
		| 'missing-content-type'
		| 'missing-entry';

	/**
	 * Additional context about the issue
	 */
	readonly details?: string;
}

export interface ValidationReport {
	/**
	 * Total number of entries checked
	 */
	readonly totalEntriesChecked: number;

	/**
	 * Number of entries with invalid references
	 */
	readonly entriesWithIssues: number;

	/**
	 * List of all invalid references found
	 */
	readonly invalidReferences: readonly InvalidReference[];

	/**
	 * Summary by issue type
	 */
	readonly summary: {
		readonly 'invalid-structure': number;
		readonly 'missing-asset': number;
		readonly 'missing-content-type': number;
		readonly 'missing-entry': number;
	};
}
