import HandledError from '../ui/HandledError.js';
import type TransferResults from './xfer/TransferResults.js';

export default class SchemaOperationError extends HandledError {
	public constructor() {
		super('Schema push/pull operation failed.');
		this.name = 'SchemaOperationError';
	}

	public static throwIfFailuresExist(
		results: IterableIterator<PromiseSettledResult<TransferResults>>,
	) {
		for (const result of results) {
			if (result.status === 'rejected' || result.value.errored.size > 0) {
				throw new SchemaOperationError();
			}
		}
	}
}
