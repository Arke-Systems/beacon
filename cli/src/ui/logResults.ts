import type TransferResults from '#cli/schema/xfer/TransferResults.js';
import { styleText } from 'node:util';
import createStylus from './createStylus.js';
import HandledError from './HandledError.js';
import humanizeList from './humanizeList.js';
import type UiContext from './UiContext.js';

const terminalWidth = process.stdout.columns || Infinity;
type OptResults =
	| ReadonlyMap<string, PromiseSettledResult<TransferResults>>
	| undefined;

export default function logResults(ui: UiContext, results: OptResults) {
	const noData = new Set<string>();

	results?.forEach((result, name) => {
		if (result.status === 'rejected') {
			const reason =
				result.reason instanceof Error
					? result.reason.message
					: String(result.reason);

			const icon = styleText('redBright', '⚠');
			const humanName = styleText('yellowBright', name);
			const humanMsg = styleText('redBright', reason);
			ui.error(`${icon} Failed to transfer ${humanName}: ${humanMsg}\n`);
		} else if (!logSectionResults(ui, name, result.value)) {
			noData.add(name);
		}
	});

	logNoData(ui, noData);

	logCollectedErrors(ui, results);
}

function logSectionResults(
	ui: UiContext,
	header: string,
	results: TransferResults,
) {
	const indent = '  ';
	const sep = ': ';
	const stylus = createStylus('yellowBright');

	const logSet = (
		set: ReadonlySet<string> | undefined,
		action: string,
		actionStyle: Parameters<typeof styleText>[0] = 'greenBright',
	) => {
		if (!set || set.size === 0) {
			return;
		}

		const consumedWidth = action.length + sep.length + indent.length;
		const maxWidth = terminalWidth - consumedWidth;
		const human = humanizeList([...set], { maxWidth, stylus });
		return `${indent}${styleText(actionStyle, action)}${sep}${human}.`;
	};

	const lines = [
		logSet(results.created, 'Created'),
		logSet(results.updated, 'Updated'),
		logSet(results.deleted, 'Deleted'),
		ui.options.verbose ? logSet(results.unmodified, 'Unmodified') : null,
		logSet(new Set(results.errored.keys()), 'Errored', 'redBright'),
	].filter(Boolean);

	const headerLine = `${styleText(['bold', 'underline'], header)}:`;

	if (lines.length === 0) {
		return false;
	}

	ui.info([headerLine, ...lines, ''].join('\n'));
	return true;
}

function logNoData(ui: UiContext, noData: ReadonlySet<string>) {
	const stylus = createStylus('dim');
	const consumedWidth = 'No Data: '.length;
	const maxWidth = terminalWidth - consumedWidth;

	ui.info(
		`${styleText(['bold', 'underline'], 'No Data')}:`,
		humanizeList([...noData], { maxWidth, stylus }),
	);
}

function logCollectedErrors(ui: UiContext, results: OptResults) {
	if (!results) {
		return;
	}

	for (const [sectionName, result] of results) {
		if (result.status === 'rejected') {
			ui.info(
				`\nFatal Error in ${sectionName}:`,
				`[${typeof result.reason}]`,
				result.reason instanceof HandledError
					? result.reason.humanized.trimEnd()
					: result.reason,
			);
		} else {
			for (const [key, error] of result.value.errored) {
				ui.info(
					'\nError in',
					styleText('yellowBright', sectionName),
					'for',
					`${styleText('yellowBright', key)}:`,
					error instanceof HandledError ? error.humanized.trimEnd() : error,
				);
			}
		}
	}
}
