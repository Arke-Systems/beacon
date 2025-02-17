import type ActionType from './ActionType.js';

export default interface TermAction {
	readonly type: ActionType;
	readonly key: string;
	readonly fn: () => Promise<void>;
}
