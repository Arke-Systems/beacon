import getUi from './SchemaUi.js';

export default function createProgressBar(
	name: string,
	...indicies: readonly ReadonlyMap<unknown, unknown>[]
) {
	const totalSize = new Set(indicies.flatMap((x) => [...x.keys()])).size;
	return getUi().createProgressBar(name, totalSize);
}
