# Beacon

Welcome to the `@arke-systems/beacon` repository. This project contains
development tools, scripts, and CI/CD support for the Beacon project.

## Getting Started

This project uses [yarn][1] as a package manager. Use `yarn install` to install
the dependencies.

To test locally, you will need an `.env` file. Copy the `.env.example` file to
create your own `.env` file.

## Development

Some development scripts are provided:

- `yarn build` - Compile TypeScript code.
- `yarn clean` - Remove compiled code.
- `yarn cli` - Invoke the CLI.
- `yarn lint` - Invoke ESLint.
- `yarn pretty` - Invoke Prettier.
- `yarn test` - Invoke unit tests.
- `yarn workspace @arke-systems/beacon-cli generate` - Rebuild OpenAPI type
  definitions.

## Deployment

This repository provides a CLI tool that can be installed into other projects
as an NPM package.

New releases of this tool are handled by the `publish-package` GitHub Action.
To invoke this action, create and publish a [new release][2] in GitHub.

[1]: https://yarnpkg.com/ 'Yarn package manager'
[2]: https://github.com/Arke-Systems/beacon/releases/new 'Create a new release'
