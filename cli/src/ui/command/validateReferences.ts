import resolveConfig from '#cli/cfg/resolveConfig.js';
import { createClient } from '#cli/cs/api/Client.js';
import type { ValidationReport } from '#cli/schema/references/InvalidReference.js';
import { validateReferences } from '#cli/schema/references/validateReferences.js';
import { Store } from '#cli/schema/lib/SchemaUi.js';
import createStylus from '#cli/ui/createStylus.js';
import HandledError from '#cli/ui/HandledError.js';
import { ConsoleUiContext } from '#cli/ui/UiContext.js';
import { Command } from 'commander';
import type { CommonOptions } from '../option/commonOptions.js';
import { addCommonOptions } from '../option/commonOptions.js';

const validate = new Command('validate-references');
addCommonOptions(validate);

validate.description(
	'Validate all entry and asset references in Contentstack without modifying any data.',
);

type CommandOptions = CommonOptions;

validate.action(async (cliOptions: CommandOptions) =>
	HandledError.ExitIfThrown(async () => {
		const options = await mapOptions(cliOptions);
		using ui = new ConsoleUiContext(options);

		ui.info('\nValidating references in Contentstack...\n');

		const report = await Store.run(ui, async () => {
			await using client = createClient(ui);
			return await validateReferences(client);
		});

		displayValidationReport(ui, report);

		if (report.invalidReferences.length > 0) {
			process.exitCode = 1;
		}
	}),
);

export default validate;

function displayValidationReport(
	ui: ConsoleUiContext,
	report: ValidationReport,
): void {
	const y = createStylus('yellowBright');
	const g = createStylus('greenBright');
	const r = createStylus('redBright');
	const lineLength = 60;

	ui.info('\n' + y`Validation Report:`);
	ui.info('─'.repeat(lineLength));

	displaySummaryStats(ui, report, y, g, r);

	if (report.invalidReferences.length > 0) {
		displayIssuesByType(ui, report, r);
		displayDetailedIssues(ui, report, y, r);
		displayErrorSummary(ui, report, r);
	} else {
		ui.info(g`✓ All references are valid!`);
		ui.info('');
	}
}

function displaySummaryStats(
	ui: ConsoleUiContext,
	report: ValidationReport,
	y: ReturnType<typeof createStylus>,
	g: ReturnType<typeof createStylus>,
	r: ReturnType<typeof createStylus>,
): void {
	ui.info(y`Total entries checked:      ${String(report.totalEntriesChecked)}`);
	ui.info(
		report.entriesWithIssues > 0
			? r`Entries with issues:        ${String(report.entriesWithIssues)}`
			: g`Entries with issues:        ${String(report.entriesWithIssues)}`,
	);
	ui.info(
		y`Total invalid references:   ${String(report.invalidReferences.length)}`,
	);
	ui.info('');
}

function displayIssuesByType(
	ui: ConsoleUiContext,
	report: ValidationReport,
	r: ReturnType<typeof createStylus>,
): void {
	ui.info(createStylus('yellowBright')`Issues by type:`);

	if (report.summary['missing-entry'] > 0) {
		ui.info(
			r`  Missing entries:          ${String(report.summary['missing-entry'])}`,
		);
	}
	if (report.summary['missing-content-type'] > 0) {
		ui.info(
			r`  Missing content types:    ${String(report.summary['missing-content-type'])}`,
		);
	}
	if (report.summary['missing-asset'] > 0) {
		ui.info(
			r`  Missing assets:           ${String(report.summary['missing-asset'])}`,
		);
	}
	if (report.summary['invalid-structure'] > 0) {
		ui.info(
			r`  Invalid structures:       ${String(report.summary['invalid-structure'])}`,
		);
	}
	ui.info('');
}

function displayDetailedIssues(
	ui: ConsoleUiContext,
	report: ValidationReport,
	y: ReturnType<typeof createStylus>,
	r: ReturnType<typeof createStylus>,
): void {
	ui.info(y`Detailed issues:\n`);

	const issuesByEntry = groupIssuesByEntry(report);
	const issueTypePadding = 20;
	const fieldPathPadding = 25;

	for (const [entry, issues] of issuesByEntry) {
		ui.info(r`Entry: ${entry}`);
		for (const issue of issues) {
			ui.info(
				`  ${issue.issueType.padEnd(issueTypePadding)} ${issue.fieldPath.padEnd(fieldPathPadding)} → ${issue.toContentTypeUid}/${issue.toIdentifier}`,
			);
			if (issue.details) {
				const dim = createStylus('dim');
				ui.info(`    ${dim([issue.details])}`);
			}
		}
		ui.info('');
	}
}

function displayErrorSummary(
	ui: ConsoleUiContext,
	report: ValidationReport,
	r: ReturnType<typeof createStylus>,
): void {
	ui.error(
		'\n' +
			r`Validation failed: Found ${String(report.invalidReferences.length)} invalid reference(s) in ${String(report.entriesWithIssues)} entry(ies).`,
	);
}

function groupIssuesByEntry(
	report: ValidationReport,
): Map<string, (typeof report.invalidReferences)[number][]> {
	const issuesByEntry = new Map<
		string,
		(typeof report.invalidReferences)[number][]
	>();
	for (const issue of report.invalidReferences) {
		const existing = issuesByEntry.get(issue.fromEntry) ?? [];
		existing.push(issue);
		issuesByEntry.set(issue.fromEntry, existing);
	}
	return issuesByEntry;
}

async function mapOptions(options: CommandOptions) {
	return resolveConfig({
		client: {
			apiKey: options.apiKey,
			baseUrl: options.baseUrl,
			branch: options.branch,
			managementToken: options.managementToken,
			timeout: options.apiTimeout,
		},
		configFile: options.configFile,
		namedEnvironment: options.environment,
		schema: {
			// These don't really matter for validation, but we need them for config resolution
			deletionStrategy: 'delete',
			extension: {
				byName: new Map(),
				byUid: new Map(),
			},
			jsonRtePlugin: undefined,
			schemaPath: process.cwd(),
		},
		verbose: options.verbose,
	});
}
