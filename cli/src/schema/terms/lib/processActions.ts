import type Term from '#cli/cs/terms/Term.js';
import getUi from '#cli/schema/lib/SchemaUi.js';
import type TransferResults from '#cli/schema/xfer/TransferResults.js';
import { MutableTransferResults } from '#cli/schema/xfer/TransferResults.js';
import ProgressReporter from '#cli/ui/progress/ProgressReporter.js';
import {
	pastParticiple,
	presentParticiple,
	resultKeyFor,
} from './ActionType.js';
import type TermAction from './TermAction.js';

export default async function processActions(
	human: string,
	actions: readonly TermAction[],
	allTerms: readonly Term[],
): Promise<TransferResults> {
	const result = new MutableTransferResults();
	allTerms.map((term) => term.uid).forEach((uid) => result.unmodified.add(uid));

	if (actions.length === 0) {
		return result;
	}

	using bar = getUi().createProgressBar(human, actions.length);

	for (const action of actions) {
		result.unmodified.delete(action.key);

		using reporter = new ProgressReporter(
			bar,
			presentParticiple(action.type),
			action.key,
		);

		try {
			await action.fn();
			result[resultKeyFor(action.type)].add(action.key);
			reporter.finish(pastParticiple(action.type));
		} catch (ex: unknown) {
			result.errored.set(action.key, ex);
		}
	}

	return result;
}
