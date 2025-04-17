import type { Config } from '../Config.schema.yaml';

export default function transformClientConfig(
	baseClient: Config['client'],
	envClient: Config['client'],
) {
	const resolved = { ...baseClient, ...envClient };

	const {
		'api-key': apiKey,
		'base-url': baseUrl,
		branch,
		'management-token': managementToken,
		timeout,
	} = resolved;

	const result = {
		...(apiKey ? { apiKey } : {}),
		...(baseUrl ? { baseUrl: new URL(baseUrl) } : {}),
		...(branch ? { branch } : {}),
		...(managementToken ? { managementToken } : {}),
		...(typeof timeout === 'number' ? { timeout } : {}),
	};

	return Object.keys(result).length > 0 ? result : undefined;
}
