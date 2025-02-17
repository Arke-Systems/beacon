import { styleText } from 'node:util';
import { relative } from 'node:path';
import { fileURLToPath } from 'node:url';

export function humanizePath(path) {
	return styleText(
		'yellowBright',
		relative(process.cwd(), fileURLToPath(path)),
	);
}
