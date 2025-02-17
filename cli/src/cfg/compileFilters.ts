import type { MinimatchOptions } from 'minimatch';
import { filter } from 'minimatch';
import type { Config } from './Config.schema.yaml';

type SchemaConfig = NonNullable<Config['schema']>;
type Filters = NonNullable<SchemaConfig['assets']>;

export default function compileFilters(filters: Filters) {
	const cfg: MinimatchOptions = { dot: true, nocomment: true };
	const compile = (pattern: string) => filter(pattern, cfg);

	const include = [...new Set(filters.include)].map(compile);
	const exclude = [...new Set(filters.exclude)].map(compile);
	type Fn = (typeof include)[number];

	function isIncluded(path: string) {
		const predicate = (x: Fn) => x(path);

		if (exclude.some(predicate)) {
			return false;
		}

		return include.some(predicate);
	}

	return isIncluded;
}
