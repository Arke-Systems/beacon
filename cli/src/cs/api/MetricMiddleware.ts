import type { Histogram } from 'node:perf_hooks';
import { createHistogram, performance } from 'node:perf_hooks';
import type { MiddlewareCallbackParams } from 'openapi-fetch';

export default class MetricMiddleware {
	readonly #histogram = createHistogram();

	public get histogram(): Histogram {
		return this.#histogram;
	}

	// Justification: This method is required by the openapi-fetch middleware API.
	// eslint-disable-next-line @typescript-eslint/class-methods-use-this
	public onRequest(o: MiddlewareCallbackParams) {
		performance.mark(o.id);
	}

	public onResponse(o: MiddlewareCallbackParams & { response: Response }) {
		const measure = performance.measure(o.id, o.id);
		performance.clearMeasures(o.id);
		performance.clearMarks(o.id);
		this.#histogram.record(Math.round(measure.duration));
	}
}
