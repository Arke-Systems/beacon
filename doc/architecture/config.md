# Configuration Architecture

Beacon pulls configuration values from three sources: the command line, a
configuration file, and environment variables. The order of precedence is:

1. Command line
2. Environment variables
3. Configuration file

The first two layers are handled by the [commander][1] library, which already
supports this sort of precedence.

The configuration file is loaded by Beacon when mapping options.

The `UiOptions` class is responsible for loading the configuration file and
providing a basic set of options which can be further mutated by the command
line and environment variables.

[1]: https://github.com/tj/commander.js 'commander'
