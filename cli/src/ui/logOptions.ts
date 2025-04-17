import createStylus from './createStylus.js';
import type Options from './Options.js';

export default function logOptions(options: Options) {
	const b = createStylus('bold');
	const y = createStylus('yellowBright');
	const d = createStylus('dim');

	const parts = [
		b`  - ${'API Url'}: `,
		y`${options.client.baseUrl.toString()}\n`,
	];

	parts.push(b`  - ${'Extensions'}:`);
	if (options.schema.extension.byName.size) {
		parts.push('\n');
		for (const [name, uid] of options.schema.extension.byName) {
			parts.push(y`    - ${name}: ${uid}\n`);
		}
	} else {
		parts.push(d` ${'None'}\n`);
	}

	parts.push(b`  - ${'JSON RTE Plugins'}:`);
	if (options.schema.jsonRtePlugin.byName.size) {
		parts.push('\n');
		for (const [name, uid] of options.schema.jsonRtePlugin.byName) {
			parts.push(y`    - ${name}: ${uid}\n`);
		}
	} else {
		parts.push(d` ${'None'}\n`);
	}

	parts.push(b`  - ${'Verbose'}: `, y`${String(options.verbose)}\n`);

	return parts.join('');
}
