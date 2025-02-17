import type ProgressBar from './ProgressBar.js';

const oneSecond = 1000;

export default class ProgressReporter implements Disposable {
	readonly #start = performance.now();
	readonly #timer = setInterval(() => this.#report(), oneSecond);
	#disposed = false;

	public constructor(
		private readonly bar: ProgressBar,
		private readonly presentTense: string,
		private readonly key: string,
	) {}

	[Symbol.dispose]() {
		if (!this.#disposed) {
			clearInterval(this.#timer);
			this.#disposed = true;
		}
	}

	finish(pastTense: string) {
		this[Symbol.dispose]();

		this.bar.update({
			action: pastTense,
			elapsedMs: performance.now() - this.#start,
			key: this.key,
		});
	}

	#report() {
		this.bar.update({
			action: this.presentTense,
			elapsedMs: performance.now() - this.#start,
			key: this.key,
		});
	}
}
