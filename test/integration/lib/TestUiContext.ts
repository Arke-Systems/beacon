import type LogContext from '#cli/ui/LogContext.js';
import type { TaxonomyStrategy } from '#cli/ui/Options.js';
import type ProgressBar from '#cli/ui/progress/ProgressBar.js';
import type UiContext from '#cli/ui/UiContext.js';

type Writable<T> = {
	// Justification: Use of Function is intentional because we wish it to
	// apply to all functions, not just those with a specific signature.
	// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
	-readonly [K in keyof T]: T[K] extends Function | URL
		? T[K]
		: T[K] extends ReadonlyMap<string, TaxonomyStrategy>
			? Map<string, TaxonomyStrategy>
			: T[K] extends ReadonlyMap<string, string>
				? Map<string, string>
				: T[K] extends ReadonlySet<string>
					? Set<string>
					: T[K] extends object
						? Writable<T[K]>
						: T[K];
};

export default class TestUiContext implements UiContext {
	public readonly error: Console['error'];
	public readonly info: Console['info'];
	public readonly warn: Console['warn'];

	public constructor(
		public readonly options: Writable<UiContext['options']>,
		logContext: LogContext = console,
	) {
		this.error = logContext.error.bind(logContext);
		this.info = logContext.info.bind(logContext);
		this.warn = logContext.warn.bind(logContext);
	}

	createProgressBar(): ProgressBar {
		return {
			increment() {
				// no-op
			},
			update() {
				// no-op
			},
			[Symbol.dispose]() {
				// no-op
			},
		};
	}
}
