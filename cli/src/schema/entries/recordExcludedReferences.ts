import type Ctx from '../ctx/Ctx.js';

export default function recordExcludedReferences(
	ctx: Ctx,
	isIncluded: (contentTypeUid: string) => boolean,
) {
	for (const contentType of ctx.fs.contentTypes.values()) {
		if (isIncluded(contentType.uid)) {
			continue;
		}

		for (const entry of ctx.cs.entries.byTitleFor(contentType.uid).values()) {
			ctx.references.recordEntryForReferences(contentType.uid, entry);
		}
	}
}
