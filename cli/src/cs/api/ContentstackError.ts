import HandledError from '#cli/ui/HandledError.js';
import isRecord from '#cli/util/isRecord.js';
import { inspect, styleText } from 'node:util';

export default class ContentstackError extends HandledError {
	public constructor(
		message: string,
		public readonly code: number,
		public readonly details: Record<string, readonly string[]>,
		public readonly context?: string,
	) {
		super([...humanize(message, code, details, context)].join(''));
	}

	public static throwIfError(error: unknown, context?: string) {
		if (isErrorResponse(error)) {
			throw new ContentstackError(
				error.error_message ?? '',
				error.error_code ?? -1,
				error.errors ?? {},
				context,
			);
		}
	}
}

interface ErrorResponse {
	readonly error_message?: string;
	readonly error_code?: number;
	readonly errors?: Record<string, string[]>;
}

function isErrorResponse(o: unknown): o is ErrorResponse {
	if (!isRecord(o)) {
		return false;
	}

	if ('error_message' in o && typeof o.error_message !== 'string') {
		return false;
	}

	if ('error_code' in o && typeof o.error_code !== 'number') {
		return false;
	}

	if (!('errors' in o)) {
		return true;
	}

	const { errors } = o;

	if (!isRecord(errors)) {
		return false;
	}

	for (const values of Object.values(errors)) {
		if (!Array.isArray(values)) {
			return false;
		}

		if (!values.every((v) => typeof v === 'string')) {
			return false;
		}
	}

	return true;
}

function* humanize(
	message: string,
	code: number,
	details: Record<string, readonly string[]>,
	context: string | undefined,
) {
	if (context) {
		yield styleText('redBright', '⚠');
		yield ' ';
		yield context;
		yield '\n';
	}

	yield 'The Contentstack API reported an error';

	if (code > 0) {
		yield ' (';
		yield styleText('yellowBright', code.toString());
		yield '): ';
	} else {
		yield ': ';
	}

	yield styleText('redBright', message);

	if (!message.endsWith('.')) {
		yield '.';
	}

	if (Object.keys(details).length) {
		yield '\nDetails: ';
		yield inspect(details, { colors: true, depth: Infinity });
		yield '\n';
	}
}
