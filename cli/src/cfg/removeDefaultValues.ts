import type { PartialOptions } from '../ui/PartialOptions.js';
import { defaultValues } from './defaultValues.js';

// The "fromCommandEnvironment" parameter is provided by commander.js after
// parsing command-line arguments and environment variables, and adding the
// default values.
//
// This is a problem because we wish to respect this precedence:
//
//   1. Command line
//   2. Environment variables
//   3. Configuration file
//   4. (implied) Default values
//
// Thus, if the "fromCommandEnvironment" parameter is provided, it will contain
// default values as the wrong precedence, and any values provided by the
// configuration file will be ignored.
//
// I have considered removing the default values from the commander.js
// configuration, but I have decided against it because doing so would
// also remove the default values from the help text.
//
// Therefore, we must remove the default values from the fromCommandEnvironment
// parameter before using it.
export default function removeDefaultValues(
	fromCommandEnvironment: PartialOptions,
): PartialOptions {
	const {
		client: rawClient,
		schema: rawSchema,
		...rest
	} = fromCommandEnvironment;

	const client = handleClient(rawClient);
	const schema = handleSchema(rawSchema);

	return {
		...rest,
		...(client ? { client } : {}),
		...(schema ? { schema } : {}),
	};
}

function handleClient(
	client: PartialOptions['client'],
): PartialOptions['client'] {
	const { branch, timeout, ...rest } = client ?? {};

	const hasBranch = branch && branch !== defaultValues.client.branch;

	const hasTimeout =
		typeof timeout === 'number' && timeout !== defaultValues.client.timeout;

	const result: PartialOptions['client'] = {
		...rest,
		...(hasBranch ? { branch } : {}),
		...(hasTimeout ? { timeout } : {}),
	};

	return Object.keys(result).length > 0 ? result : undefined;
}

function handleSchema(
	schema: PartialOptions['schema'],
): PartialOptions['schema'] {
	const { deletionStrategy, schemaPath, ...rest } = schema ?? {};

	const hasDeletionStrategy =
		deletionStrategy &&
		deletionStrategy !== defaultValues.schema.deletionStrategy;

	const hasSchemaPath =
		schemaPath && schemaPath !== defaultValues.schema.schemaPath;

	const result: PartialOptions['schema'] = {
		...rest,
		...(hasDeletionStrategy ? { deletionStrategy } : {}),
		...(hasSchemaPath ? { schemaPath } : {}),
	};

	return Object.keys(result).length > 0 ? result : undefined;
}
