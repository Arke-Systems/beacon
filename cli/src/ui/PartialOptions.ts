import type Options from './Options.js';

// Justification: Use of Function is intentional because we wish it to apply to
// all functions, not just those with a specific signature.
/* eslint-disable @typescript-eslint/no-unsafe-function-type */

type RecursivePartial<T> = {
	[P in keyof T]?: T[P] extends
		| Function
		| ReadonlyMap<string, string>
		| ReadonlySet<string>
		| URL
		? T[P] | undefined
		: T[P] extends object
			? RecursivePartial<T[P]> | undefined
			: T[P] | undefined;
};

export type PartialOptions = RecursivePartial<Options>;
