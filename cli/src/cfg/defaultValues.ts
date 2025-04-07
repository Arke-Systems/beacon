import type { PartialOptions } from '../ui/PartialOptions.js';
import { defaultValue as timeout } from '../ui/option/apiTimeout.js';
import { defaultValue as branch } from '../ui/option/branch.js';
import { defaultValue as strategy } from '../ui/option/deletionStrategy.js';
import { defaultValue as schemaPath } from '../ui/option/schemaPath.js';

export const defaultValues = {
	client: { branch, timeout },
	schema: { deletionStrategy: strategy, schemaPath },
} as const satisfies PartialOptions;
