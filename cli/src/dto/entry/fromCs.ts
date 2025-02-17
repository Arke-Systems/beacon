import type { ContentType } from '#cli/cs/content-types/Types.js';
import type { Entry, ReferencePath } from '#cli/cs/entries/Types.js';
import EntryWalker from '#cli/cs/entryWalker/EntryWalker.js';
import type Ctx from '#cli/schema/ctx/Ctx.js';
import ReplacerPipeline from './lib/ReplacerPipeline.js';

export default function fromCs(
	ctx: Ctx,
	contentType: ContentType,
	entry: Entry,
) {
	const refPath: ReferencePath = `${contentType.uid}/${entry.title}`;
	const pipeline = new ReplacerPipeline(ctx, refPath);

	const walker = new EntryWalker(
		ctx.cs.globalFields,
		refPath,
		pipeline.process.bind(pipeline),
	);

	return walker.process(contentType.schema, entry);
}
