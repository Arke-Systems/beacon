import { styleText } from 'node:util';
import { spawnSync } from 'node:child_process';
import { humanizePath } from './humanize.js';
import { fileURLToPath } from 'node:url';

export default function compileTypeScript(tsConfigUrl) {
	console.info('Compiling', humanizePath(tsConfigUrl));

	const tsConfigPath = fileURLToPath(tsConfigUrl);

	const result = spawnSync('yarn', ['tsc', '--build', tsConfigPath], {
		shell: true,
		stdio: 'inherit',
	});

	// Check for spawn errors
	if (result.error) {
		console.error(styleText('redBright', 'Build failed: spawn error'));
		console.error(result.error);
		process.exit(1);
	}

	// Check if process was terminated by a signal
	if (result.signal) {
		console.error(
			styleText('redBright', 'Build failed: process terminated by signal'),
			result.signal,
		);
		process.exit(1);
	}

	// Check exit status
	if (result.status !== 0) {
		console.error(
			styleText('redBright', 'Build failed with exit code:'),
			result.status,
		);
		process.exit(result.status || 1);
	}

	// Build succeeded (status is 0)
}
