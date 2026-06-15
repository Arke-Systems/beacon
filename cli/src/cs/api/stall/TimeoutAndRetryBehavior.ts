import EventEmitter from 'node:events';
import ApiTimeoutError from './ApiTimeoutError.js';
import RequestWithTimeout from './RequestWithTimeout.js';

const maxAttempts = 5; // arbitrary.

interface EventMap {
	readonly 'stall-encountered': [Request, number, number];
	readonly 'stall-failed': [Request];
}

export default class TimeoutAndRetryBehavior extends EventEmitter<EventMap> {
	public constructor(private readonly _timeout: number) {
		super();
	}

	public async fetch(...args: Parameters<typeof fetch>) {
		const [original] = args;

		if (!(original instanceof Request)) {
			throw new TypeError('Expected input to be a Request');
		}

		let attempts = 0;

		do {
			// Always clone the request to avoid "Request already used" errors on retries
			// Clone before first use since RequestWithTimeout will consume it
			const requestForAttempt = original.clone();
			using antiStallRequest = new RequestWithTimeout(
				requestForAttempt,
				this._timeout,
			);

			try {
				return await fetch(antiStallRequest);
			} catch (ex: unknown) {
				if (!(ex instanceof ApiTimeoutError)) {
					throw ex;
				}

				attempts += 1;
				this.emit('stall-encountered', original, attempts, maxAttempts);
			}
		} while (attempts < maxAttempts);

		this.emit('stall-failed', original);
		throw new ApiTimeoutError();
	}
}
