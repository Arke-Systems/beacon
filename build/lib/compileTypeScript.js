import { styleText } from 'node:util';
import { spawnSync } from 'node:child_process';
import { humanizePath } from './humanize.js';
import { fileURLToPath } from 'node:url';

export default function compileTypeScript(tsConfigUrl) {
	console.info('Compiling', humanizePath(tsConfigUrl));

	const tsConfigPath = fileURLToPath(tsConfigUrl);

	const buildResult = spawnSync('yarn', ['tsc', '--build', tsConfigPath], {
		stdio: 'inherit',
	}).status;

	if (buildResult !== 0 && buildResult !== null) {
		console.warn(styleText('redBright', 'Build failed'));
		process.exit(buildResult);
	}
}
