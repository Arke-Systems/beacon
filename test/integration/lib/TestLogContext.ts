import type LogContext from '#cli/ui/LogContext.js';

export default class TestLogContext implements LogContext {
	public readonly errors: unknown[] = [];
	public readonly infos: unknown[] = [];
	public readonly warnings: unknown[] = [];

	public clear() {
		this.errors.length = 0;
		this.infos.length = 0;
		this.warnings.length = 0;
	}

	error(...messages: unknown[]) {
		this.errors.push(...messages);
	}

	info(...messages: unknown[]) {
		this.infos.push(...messages);
	}

	warn(...messages: unknown[]) {
		this.warnings.push(...messages);
	}
}
