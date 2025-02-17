import isRecord from '#cli/util/isRecord.js';

export default interface Payload {
	readonly action?: string | undefined;
	readonly elapsedMs?: number | undefined;
	readonly key?: string | undefined;
	readonly name: string;
}

export function isPayload(payload: unknown): payload is Payload {
	if (!isRecord(payload) || typeof payload.name !== 'string') {
		return false;
	}

	if ('action' in payload) {
		if (!isOptional('string')(payload.action)) {
			return false;
		}
	}

	if ('elapsedMs' in payload) {
		if (!isOptional('number')(payload.elapsedMs)) {
			return false;
		}
	}

	if ('key' in payload) {
		if (!isOptional('string')(payload.key)) {
			return false;
		}
	}

	return true;
}

function isOptional(type: 'number' | 'string') {
	return (value: unknown) => typeof value === type || value === undefined;
}
