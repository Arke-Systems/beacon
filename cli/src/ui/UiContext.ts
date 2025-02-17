import { MultiBar } from 'cli-progress';
import type LogContext from './LogContext.js';
import type Options from './Options.js';
import createEmitter from './progress/createEmitter.js';
import formatProgress from './progress/formatProgress.js';
import type ProgressBar from './progress/ProgressBar.js';
import UiProgressBar from './progress/UiProgressBar.js';
import VerboseProgressBar from './progress/VerboseProgressBar.js';

export default interface UiContext extends LogContext {
	readonly options: Options;
	createProgressBar(name: string, total: number): ProgressBar;
}

export class ConsoleUiContext implements UiContext, Disposable {
	readonly error: Console['warn'];
	readonly info: Console['info'];
	readonly warn: Console['warn'];

	#barContainer: MultiBar | undefined;
	#maxNameLength = -Infinity;
	#maxTotalLength = '999'.length;

	public constructor(public readonly options: Options) {
		this.error = createEmitter(this, 'error');
		this.info = createEmitter(this, 'info');
		this.warn = createEmitter(this, 'warn');
	}

	get barContainer() {
		return this.#barContainer;
	}

	get maxProgressNameLength() {
		return this.#maxNameLength;
	}

	get maxTotalLength() {
		return this.#maxTotalLength;
	}

	createProgressBar(name: string, total: number): ProgressBar {
		const totalLength = total.toLocaleString().length;

		this.#maxNameLength = Math.max(this.#maxNameLength, name.length);
		this.#maxTotalLength = Math.max(this.#maxTotalLength, totalLength);

		if (this.options.verbose) {
			return new VerboseProgressBar(this, name, total);
		}

		const container = this.#getOrCreateBarContainer();
		return new UiProgressBar(name, container, total);
	}

	stopAllBars() {
		this.#barContainer?.stop();
		this.#barContainer = undefined;
	}

	[Symbol.dispose](): void {
		this.stopAllBars();
	}

	#getOrCreateBarContainer(): MultiBar {
		return (this.#barContainer ??= new MultiBar({
			clearOnComplete: false,
			forceRedraw: true,
			format: formatProgress.bind(null, this),
			gracefulExit: true,
			hideCursor: true,
			stopOnComplete: true,
			stream: process.stdout,
		}));
	}
}
