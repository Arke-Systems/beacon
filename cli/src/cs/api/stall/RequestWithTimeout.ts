import ApiTimeoutError from './ApiTimeoutError.js';

export default class RequestWithTimeout extends Request implements Disposable {
	readonly #timer: NodeJS.Timeout;

	public constructor(request: Request, timeout: number) {
		const controller = new AbortController();

		super(request, {
			signal: AbortSignal.any([request.signal, controller.signal]),
		});

		this.#timer = setTimeout(
			() => controller.abort(new ApiTimeoutError()),
			timeout,
		);
	}

	[Symbol.dispose](): void {
		clearTimeout(this.#timer);
	}
}
