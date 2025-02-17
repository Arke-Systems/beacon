import type { Histogram } from 'node:perf_hooks';
import type createOpenApiClient from 'openapi-fetch';
import MetricMiddleware from './MetricMiddleware.js';

export default function attachMetricCollector<
	TClient extends ReturnType<typeof createOpenApiClient>,
>(client: TClient) {
	const middleware = new MetricMiddleware();
	client.use(middleware);

	Object.defineProperty(client, 'performance', {
		get: () => middleware.histogram,
	});

	return client as TClient & { readonly performance: Histogram };
}
