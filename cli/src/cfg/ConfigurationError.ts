import type { ErrorObject } from 'ajv';
import { Ajv } from 'ajv';
import type { PathLike } from 'node:fs';
import { inspect } from 'node:util';
import HandledError from '../ui/HandledError.js';
import createStylus from '../ui/createStylus.js';

export default class ConfigurationError extends HandledError {
	public constructor(
		public readonly configPath: PathLike,
		public readonly details: ErrorObject[] | null | undefined,
	) {
		const ajv = new Ajv();

		const y = createStylus('yellowBright');
		const msg1 = y`Configuration file ${String(configPath)} is invalid:\n\t`;

		const msg2 = ajv.errorsText(details, {
			dataVar: 'config',
			separator: '\n\t',
		});

		const msg3 = inspect(details, { colors: true, depth: 3 });

		super(`${msg1}${msg2}\n\n${msg3}`);
		this.name = 'ConfigurationError';
	}
}
