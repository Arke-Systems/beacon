import type Ctx from '#cli/schema/ctx/Ctx.js';
import type ReadonlyReferenceMap from '#cli/schema/references/ReferenceMap.js';

type MinimalCtx = Pick<Ctx, 'cs' | 'fs'> & {
	readonly references: ReadonlyReferenceMap;
};

export default MinimalCtx;
