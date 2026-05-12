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

	const buildResult = result.status;

	// buildResult can be:
	// - 0: Success
	// - null: May indicate success on Windows
	// - non-zero number: Failure with specific exit code
	if (buildResult !== 0 && buildResult !== null) {
		console.warn(
			styleText('redBright', 'Build failed with exit code:'),
			buildResult,
		);
		process.exit(buildResult || 1);
	}

	// Build succeeded (status is 0 or null)
}
