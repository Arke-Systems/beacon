import type Term from '#cli/cs/terms/Term.js';
import getUi from '#cli/schema/lib/SchemaUi.js';
import type TransferResults from '#cli/schema/xfer/TransferResults.js';
import {
	merge,
	MutableTransferResults,
} from '#cli/schema/xfer/TransferResults.js';
import type TermAction from './TermAction.js';

export default async function processActions(
	human: string,
	actions: readonly TermAction[],
	allTerms: readonly Term[],
): Promise<TransferResults> {
	let result = initialResults(allTerms);

	if (actions.length === 0) {
		return result;
	}

	using bar = getUi().createProgressBar(human, actions.length);

	for (const action of actions) {
		const actionResult = await action.fn(bar);
		result = merge(result, actionResult);
	}

	return result;
}

function initialResults(allTerms: readonly Term[]): TransferResults {
	const result = new MutableTransferResults();
	allTerms.forEach((term) => result.unmodified.add(term.uid));
	return result;
}
