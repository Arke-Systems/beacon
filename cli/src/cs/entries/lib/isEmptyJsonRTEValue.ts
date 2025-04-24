import isRecord from '#cli/util/isRecord.js';
import { isDeepStrictEqual } from 'node:util';

export default function isEmptyJsonRTEValue(value: Record<string, unknown>) {
	if (value.type !== 'doc') {
		return false;
	}

	const { attrs, children } = value;

	if (attrs && !isDeepStrictEqual(attrs, {})) {
		return false;
	}

	if (!children) {
		return true;
	}

	if (!Array.isArray(children)) {
		return false;
	}

	return (
		children.length === 0 ||
		(children.length === 1 && isEmptyChild(children[0]))
	);
}

function isEmptyChild(child: unknown): boolean {
	if (child === undefined) {
		return true;
	}

	if (!isRecord(child)) {
		return false;
	}

	const { attrs, type, children } = child;

	if (type !== 'p') {
		return false;
	}

	if (attrs && !isDeepStrictEqual(attrs, {})) {
		return false;
	}

	if (!children) {
		return true;
	}

	return (
		Array.isArray(children) &&
		(children.length === 0 || isDeepStrictEqual(children, [{ text: '' }]))
	);
}
