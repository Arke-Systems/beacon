import type ProgressBar from '#cli/ui/progress/ProgressBar.js';
import type TransferResults from '../../xfer/TransferResults.js';
import type ActionType from './ActionType.js';

export default interface TermAction {
	readonly type: ActionType;
	readonly key: string;
	readonly fn: (bar: ProgressBar) => Promise<TransferResults>;
}
