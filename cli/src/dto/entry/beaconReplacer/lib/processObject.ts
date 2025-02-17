import type BeaconReplacer from '../../BeaconReplacer.js';

export default function processObject(
	this: BeaconReplacer,
	o: Record<string, unknown>,
): Record<string, unknown> {
	return Object.fromEntries(
		Object.entries(o).map(([key, value]) => [key, this.processValue(value)]),
	);
}
