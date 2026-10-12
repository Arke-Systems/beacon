import type Ctx from '../ctx/Ctx.js';
import getUi from '../lib/SchemaUi.js';

export default function recordExcludedReferences(ctx: Ctx) {
	const { isIncluded } = getUi().options.schema.entries;

	for (const contentType of ctx.fs.contentTypes.values()) {
		if (isIncluded(contentType.uid)) {
			continue;
		}

		for (const entry of ctx.cs.entries.byTitleFor(contentType.uid).values()) {
			ctx.references.recordEntryForReferences(contentType.uid, entry);
		}
	}
}
