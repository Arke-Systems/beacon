import { InvalidArgumentError, Option } from 'commander';
import type Options from '../Options.js';

const apiTimeout = new Option('--api-timeout [ms]', 'Contentstack API timeout');

export const defaultValue = 10000;
apiTimeout.argParser(timeoutParser).default(defaultValue);

export interface ApiTimeoutOption {
	readonly apiTimeout: Options['client']['timeout'];
}

export default apiTimeout;

function timeoutParser(value: string): number {
	const parsedValue = parseInt(value, 10);

	if (isNaN(parsedValue) || parsedValue <= 0) {
		const msg = 'Invalid timeout value. Must be a positive number.';
		throw new InvalidArgumentError(msg);
	}

	return parsedValue;
}
