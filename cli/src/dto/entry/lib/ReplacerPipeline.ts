import type { ReferencePath } from '#cli/cs/entries/Types.js';
import type { SchemaField } from '#cli/cs/Types.js';
import type Ctx from '#cli/schema/ctx/Ctx.js';
import AssetReplacer from './AssetReplacer.js';
import BooleanDefaults from './BooleanDefaults.js';
import HtmlRteReplacer from './HtmlRteReplacer.js';
import JsonRteReplacer from './JsonRteReplacer.js';
import ReferenceReplacer from './ReferenceReplacer.js';
import type Replacer from './Replacer.js';
import TaxonomyRemover from './TaxonomyRemover.js';

export default class ReplacerPipeline {
	readonly #replacers: Replacer[];

	public constructor(ctx: Ctx, refPath: ReferencePath) {
		this.#replacers = [
			new AssetReplacer(ctx, refPath),
			new ReferenceReplacer(ctx, refPath),
			new JsonRteReplacer(ctx, refPath),
			new HtmlRteReplacer(ctx, refPath),
			new TaxonomyRemover(refPath),
			new BooleanDefaults(),
		];
	}

	public process(field: SchemaField, value: unknown) {
		let result = value;

		for (const replacer of this.#replacers) {
			result = replacer.process(field, result);
		}

		return result;
	}
}
