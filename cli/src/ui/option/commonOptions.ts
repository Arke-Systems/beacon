import type { Command } from 'commander';
import * as Options from './index.js';

export function addCommonOptions(cmd: Command) {
	cmd
		.addOption(Options.apiKey)
		.addOption(Options.apiTimeout)
		.addOption(Options.baseUrl)
		.addOption(Options.branch)
		.addOption(Options.configFile)
		.addOption(Options.environment)
		.addOption(Options.managementToken)
		.addOption(Options.verbose);
}

export type CommonOptions = Options.ApiKeyOption &
	Options.ApiTimeoutOption &
	Options.BaseUrlOption &
	Options.BranchOption &
	Options.ConfigFileOption &
	Options.EnvironmentOption &
	Options.ManagementTokenOption &
	Options.VerboseOption;
