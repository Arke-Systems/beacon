import { defaultValue as timeout } from '../ui/option/apiTimeout.js';
import { defaultValue as branch } from '../ui/option/branch.js';
import { defaultValue as configFile } from '../ui/option/configFile.js';
import { defaultValue as strategy } from '../ui/option/deletionStrategy.js';
import { defaultValue as schemaPath } from '../ui/option/schemaPath.js';
import type { CliOptions } from './CliOptions.js';

export const defaultValues = {
	client: { branch, timeout },
	configFile: configFile,
	schema: { deletionStrategy: strategy, schemaPath },
} as const satisfies CliOptions;
