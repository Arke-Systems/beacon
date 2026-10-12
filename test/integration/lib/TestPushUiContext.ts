import type LogContext from '#cli/ui/LogContext.js';
import { DefaultTaxonomyStrategies } from '#cli/ui/Options.js';
import TestUiContext from './TestUiContext.js';

export default class TestPushUiContext extends TestUiContext {
	public constructor(schemaPath: string, logContext: LogContext = console) {
		const apiKey = process.env.Contentstack_Api_Key;
		const baseUrl = process.env.Contentstack_Management_API;
		const extension = process.env.Beacon_Extension;
		const jsonRtePlugin = process.env.Beacon_Plugin;
		const managementToken = process.env.Contentstack_Management_Token;

		if (
			typeof apiKey !== 'string' ||
			typeof baseUrl !== 'string' ||
			typeof extension !== 'string' ||
			typeof jsonRtePlugin !== 'string' ||
			typeof managementToken !== 'string'
		) {
			throw new Error('Missing environment variables for integration tests');
		}

		super(
			{
				client: {
					apiKey,
					baseUrl: new URL(baseUrl),
					branch: 'main',
					managementToken,
					timeout: 30000,
				},
				schema: {
					assets: { isIncluded: () => true },
					deletionStrategy: 'delete',
					entries: { isIncluded: () => true },
					extension: parseMapFromEnv(extension),
					jsonRtePlugin: parseMapFromEnv(jsonRtePlugin),
					schemaPath,
					taxonomies: new Map(DefaultTaxonomyStrategies.entries()),
				},
				verbose: false,
			},
			logContext,
		);
	}
}

function parseMapFromEnv(raw: string) {
	return raw.split(' ').reduce(
		(acc, value) => {
			const [name, uid] = value.split(':');

			if (name && uid) {
				acc.byName.set(name, uid);
				acc.byUid.set(uid, name);
			}

			return acc;
		},
		{ byName: new Map<string, string>(), byUid: new Map<string, string>() },
	);
}
