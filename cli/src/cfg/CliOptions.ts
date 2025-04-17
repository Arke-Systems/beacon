import type { PathLike } from 'node:fs';
import type { PartialOptions } from '../ui/PartialOptions.js';

export type CliOptions = PartialOptions & {
	readonly configFile: PathLike;
	readonly namedEnvironment?: string;
};
