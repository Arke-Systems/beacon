import createStylus from '#cli/ui/createStylus.js';
import type UiContext from '#cli/ui/UiContext.js';
import { styleText } from 'node:util';
import createOpenApiClient from 'openapi-fetch';
import attachMetricCollector from './attachMetricCollector.js';
import attachRateLimiter from './attachRateLimiter.js';
import type { paths } from './cma-openapi-3.js';
import TimeoutAndRetryBehavior from './stall/TimeoutAndRetryBehavior.js';

type Client = ReturnType<typeof createClient>;
export default Client;

export function createClient(ui: UiContext) {
	const baseClient = createBaseClient(ui);
	const withMetrics = attachMetricCollector(baseClient);
	return attachRateLimiter(ui, withMetrics);
}

function createBaseClient(ui: UiContext) {
	const stallCatcher = new TimeoutAndRetryBehavior();

	stallCatcher.on('stall-encountered', (request, attempts, maxAttempts) => {
		const y = createStylus('yellowBright');
		const msg1 = y`${'⚠'} API stall-out on ${request.url}. Attempt `;
		const msg2 = y`${attempts.toLocaleString()} of `;
		const msg3 = y`${maxAttempts.toLocaleString()}.`;
		const msg = `${msg1}${msg2}${msg3}`;
		ui.warn(msg);
	});

	stallCatcher.on('stall-failed', (request) => {
		const icon = styleText('redBright', '⚠');
		const url = styleText('yellowBright', request.url);
		const notice = styleText('redBright', 'Giving up');
		const msg = `${icon} API stall-out on ${url}. ${notice}.`;
		ui.error(msg);
	});

	const opts = ui.options.client;

	return createOpenApiClient<paths>({
		baseUrl: opts.baseUrl.toString(),
		fetch: stallCatcher.fetch.bind(stallCatcher),
		headers: {
			api_key: opts.apiKey,
			authorization: opts.managementToken,
			branch: opts.branch,
		},
	});
}
