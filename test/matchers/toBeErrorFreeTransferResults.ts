import type TransferResults from '#cli/schema/xfer/TransferResults.js';
import isRecord from '#cli/util/isRecord.js';
import { expect } from 'vitest';

export type OperationResults = ReadonlyMap<
	string,
	PromiseSettledResult<TransferResults>
>;

expect.extend({
	toBeErrorFreeTransferResults(results: unknown) {
		if (!isOperationResults(results)) {
			return {
				message: () => 'Expected results to be an OperationResults map',
				pass: false,
			};
		}

		const fatalErrors = new Map<string, PromiseRejectedResult>();
		const errors = new Map<string, ReadonlyMap<string, unknown>>();

		for (const [module, result] of results) {
			if (result.status !== 'fulfilled') {
				fatalErrors.set(module, result);
				continue;
			}

			const { errored } = result.value;
			if (errored.size > 0) {
				errors.set(module, errored);
			}
		}

		return {
			message: () => [...messageLines(false, fatalErrors, errors)].join('\n'),
			pass: fatalErrors.size === 0 && errors.size === 0,
		};
	},
});

function* messageLines(
	isNot: boolean,
	fatalErrors: ReadonlyMap<string, PromiseRejectedResult>,
	errors: ReadonlyMap<string, ReadonlyMap<string, unknown>>,
) {
	if (fatalErrors.size > 0) {
		yield `Expected no fatal errors, but found ${fatalErrors.size}:`;

		for (const [module, result] of fatalErrors) {
			yield `  ${module}: ${result.reason}`;
		}

		if (errors.size > 0) {
			yield '';
		}
	}

	if (errors.size > 0) {
		const totalSize = [...errors.values()]
			.map((x) => x.size)
			.reduce((a, b) => a + b, 0);

		yield `Expected no errors, but found ${totalSize.toLocaleString()}:`;

		for (const [module, errored] of errors) {
			yield `  ${module}:`;

			for (const [key, value] of errored) {
				yield `    ${key}: ${String(value)}`;
			}
		}
	}
}

function isOperationResults(results: unknown): results is OperationResults {
	if (!(results instanceof Map)) {
		return false;
	}

	for (const [module, result] of results) {
		if (typeof module !== 'string') {
			return false;
		}

		if (!isRecord(result)) {
			return false;
		}

		if (result.status === 'rejected') {
			return 'reason' in result;
		}

		if (result.status !== 'fulfilled') {
			return false;
		}

		if (!isTransferResults(result.value)) {
			return false;
		}
	}

	return true;
}

function isOptionalStringSet(o: unknown): o is ReadonlySet<string> | undefined {
	if (o === undefined) {
		return true;
	}

	return o instanceof Set && [...o].every((s) => typeof s === 'string');
}

function isTransferResults(o: unknown): o is TransferResults {
	return (
		isRecord(o) &&
		isOptionalStringSet(o.created) &&
		isOptionalStringSet(o.updated) &&
		isOptionalStringSet(o.deleted) &&
		isOptionalStringSet(o.unmodified) &&
		(o.errored === undefined || o.errored instanceof Map)
	);
}
