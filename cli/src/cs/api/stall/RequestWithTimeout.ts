import ApiTimeoutError from './ApiTimeoutError.js';

const stallTimeout = 10000; // arbitrary.

export default class RequestWithTimeout extends Request implements Disposable {
	readonly #timer: NodeJS.Timeout;

	public constructor(request: Request) {
		const controller = new AbortController();

		super(request, {
			signal: AbortSignal.any([request.signal, controller.signal]),
		});

		this.#timer = setTimeout(
			() => controller.abort(new ApiTimeoutError()),
			stallTimeout,
		);
	}

	[Symbol.dispose](): void {
		clearTimeout(this.#timer);
	}
}
