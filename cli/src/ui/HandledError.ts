import { stripVTControlCharacters } from 'node:util';

// To be used when an error condition should halt execution and display an
// error message, but not a stack trace. Please ensure the provided message
// is descriptive enough to track down.
export default class HandledError extends Error {
	public constructor(public readonly humanized: string) {
		super(stripVTControlCharacters(humanized));
		this.name = 'HandledError';
	}

	public static async ExitIfThrown(fn: () => Promise<void>): Promise<void> {
		try {
			await fn();
		} catch (ex: unknown) {
			if (ex instanceof HandledError) {
				console.error(ex.humanized);
				process.exit(1);
			}

			throw ex;
		}
	}
}
