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

	// buildResult can be:
	// - 0: Success
	// - null: Success on Windows (process completed normally)
	// - non-zero number: Failure with specific exit code
	if (buildResult !== 0 && buildResult !== null) {
		console.warn(styleText('redBright', 'Build failed'));
		process.exit(buildResult);
	}

	// Build succeeded (status is 0 or null)
}
