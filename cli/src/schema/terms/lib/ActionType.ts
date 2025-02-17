import type TransferResults from '../../xfer/TransferResults.js';

type ActionType = 'create' | 'delete' | 'move' | 'update';
export default ActionType;

export function presentParticiple(type: ActionType) {
	switch (type) {
		case 'create':
			return 'creating';
		case 'delete':
			return 'deleting';
		case 'move':
			return 'moving';
		case 'update':
			return 'updating';
	}
}

export function pastParticiple(type: ActionType) {
	switch (type) {
		case 'create':
			return 'created';
		case 'delete':
			return 'deleted';
		case 'move':
			return 'moved';
		case 'update':
			return 'updated';
	}
}

export function resultKeyFor(
	actionType: ActionType,
): Exclude<keyof TransferResults, 'errored'> {
	switch (actionType) {
		case 'create':
			return 'created';
		case 'delete':
			return 'deleted';
		case 'move':
		case 'update':
			return 'updated';
	}
}
