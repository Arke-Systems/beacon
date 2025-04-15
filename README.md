<div align="center">
  <img src="./doc/Beacon.webp" alt="Logo" />
  <h1 align="center">Beacon</h1>
</div>

Beacon is a command-line tool for serializing and deserializing data from a
stack in the Contentstack headless CMS platform.

## Overview

Beacon enables full-stack synchronization by allowing users to:

- Serialize (export) a stack's entire contents, including entries, assets,
  content types, global fields, and taxonomies, into the file system.
- Store the serialized data under version control for tracking and
  CI/CD deployment.
- Deserialize (import) the stored data into a target stack, restoring
  its state.
- Create and maintain local backups of stack contents.
- Clear a stack by removing all its contents.

Beacon is particularly useful for teams working with multiple Contentstack
environments, ensuring content model consistency across development, staging,
and production.

## Pre-requisites

Before using Beacon, ensure you have the following information to connect to your stack:

1. **Stack API Key** – Required to identify your Contentstack stack.
   * [Learn how to get your API key](https://www.contentstack.com/docs/developers/apis/content-management-api#how-to-get-stack-api-key).

2. **Contentstack Management API Base URL** – Used for making API calls to your stack.
   * [See here how to get your API Base URL](https://www.contentstack.com/docs/developers/apis/content-management-api#base-url).

3. **Management Token** – Used to authenticate API requests to the stack.
   * [Discover how to generate a Management Token](https://www.contentstack.com/docs/developers/create-tokens/generate-a-management-token).


## Installation

Beacon is available as an NPM package under `@arke-systems/beacon-cli`. It can
be installed using any package manager that supports NPM packages.

### Install via Yarn:

```sh
yarn add --dev @arke-systems/beacon-cli
```

### Install via NPM:

```sh
npm install --save-dev @arke-systems/beacon-cli
```

## Usage

Beacon provides a CLI executable named `beacon`. To invoke it, use your
package manager:

```sh
yarn beacon <command>
# or
npx beacon <command>
```

### Available Commands

#### `clear`

Completely empties a stack by removing all entries, content types, global
fields, taxonomies, and assets.

#### `pull`

Serializes a stack's content into the file system for version control or backup.

#### `push`

Deserializes the contents from the file system into the stack.

### Common CLI Options

| Option                       | Description                                     | Required? |
| ---------------------------- | ----------------------------------------------- | --------- |
| `--api-key `          | API key for the stack.                          | ✅        |
| `--api-timeout `      | Timeout for API requests in milliseconds.       | ❌        |
| `--base-url `         | URL for the Contentstack Management API.        | ✅        |
| `--branch `           | Stack branch to operate on. Defaults to `main`. | ✅        |
| `--management-token ` | Token for authentication with the stack.        | ✅        |
| `--verbose`                  | Enables verbose logging.                        | ❌        |
| `--help`                     | Displays help information.                      | ❌        |

### Additional Options for `pull` and `push`

| Option                         | Description                                                   | Default       |
| ------------------------------ | ------------------------------------------------------------- | ------------- |
| `--schema-path `         | Path to store serialized data.                                | `./cs/schema` |
| `--extension [name:uid]`       | Maps third-party plugin UIDs to stable names for portability. | N/A           |
| `--json-rte-plugin [name:uid]` | Similar to `--extension` but for JSON RTE plugins.            | N/A           |

### Additional Options for `push`

| Option                                     | Description                 | Default |
| ------------------------------------------ | --------------------------- | ------- |
| `--deletion-strategy ` | Controls deletion behavior. | `warn`  |

## Handling Third-Party Plugins

Some third-party plugins in Contentstack provide custom field types or JSON RTE
plugins. Since plugin unique IDs (UIDs) are stack-specific, Beacon provides
`--extension` and `--json-rte-plugin` options to map these UIDs when
transferring data between stacks.

### Why is this necessary?

When a third-party plugin, such as Bynder, is installed in a stack, Contentstack
assigns a unique ID to its custom field type and JSON RTE plugin. These UIDs are
not exposed in the Contentstack UI, and they are different for every stack. If
serialized data references these UIDs directly, it may break when restored to
another stack where the UIDs are different. Beacon allows mapping these UIDs to
stable names so that they can be translated correctly when deserializing data
into a different stack.

### How to Find UID Values

To obtain the correct UID values for third-party plugins:

1. **Create a Test Content Type:**

   - In the Contentstack admin UI, create a new content type that includes the
     third-party plugin.
   - If the plugin provides a JSON RTE plugin, ensure it is explicitly selected
     as active for the field.
2. **Export the Content Type:**

   - Use the Contentstack admin UI to export the content type as JSON. The
     exported JSON will contain minimized data, making it challenging to read.
3. **Locate the UID Values:**

   - Within the exported JSON, find the block of JSON that corresponds to the
     custom field. It will look something like this:

     ```json
     {
       "data_type": "json",
       "display_name": "Background Image",
       "extension_uid": "blt6b7c082b-example",
       "field_metadata": { "extension": true },
       "mandatory": false,
       "multiple": false,
       "non_localizable": false,
       "uid": "background_image",
       "unique": false
     }
     ```
   - The `extension_uid` value (`blt6b7c082b-example` in this example) is the
     UID for the custom field.
4. **Identify the JSON RTE Plugin UID:**

   - Similarly, locate the JSON RTE plugin's UID within the exported JSON. It
     will be nested under the JSON RTE field’s configuration:

     ```json
     {
       "data_type": "json",
       "display_name": "Content",
       "field_metadata": {},
       "mandatory": false,
       "multiple": false,
       "non_localizable": false,
       "plugins": ["bltd0dac425-example"],
       "uid": "content",
       "unique": false
     },
     ```
   - The `plugins` array contains the JSON RTE plugin UID (`bltd0dac425-example`
     in this example).
5. **Use the UID Values in Beacon:**

   - Map these UIDs to stable names using `--extension` and `--json-rte-plugin`
     options:

     ```sh
     yarn beacon pull \
       --extension bynder:blt6b7c082b-uid-in-source-stack \
       --json-rte-plugin bynder:bltd0dac425-uid-in-source-stack
     ```
   - When pushing data to another stack, use the same mapping:

     ```sh
     yarn beacon push \
       --extension bynder:blt6b7c082b-uid-in-target-stack \
       --json-rte-plugin bynder:bltd0dac425-uid-in-target-stack
     ```
   - Note: the word `bynder` in the above examples is user-defined and
     arbitrary. It is used to identify the third-party plugin, and it will be
     serialized in the data instead of the stack-specific UID values. You can
     use any name that makes sense to you, except the same name must be used
     consistently across all commands. It is not a conflict to use the same
     name for both the `--extension` and `--json-rte-plugin` options.

By following these steps, developers can ensure that serialized content remains
portable between stacks, preventing UID mismatches that could otherwise
break integrations.

## Configuration

In addition to the command line, Beacon allows specifying options via
environment variables or an optional YAML configuration file (`beacon.yaml`).

The order of precedence is:

1. Command line
2. Environment variables
3. Configuration file

That is, options specified on the command line have the highest precedence,
followed by environment variables, and finally the configuration file.

### Environment Variables

| Variable                        | Maps To              | Required? | Default |
| ------------------------------- | -------------------- | --------- | ------- |
| `Contentstack_Api_Key`          | `--api-key`          | ✅        | N/A     |
| `Contentstack_Management_API`   | `--base-url`         | ✅        | N/A     |
| `Contentstack_Branch`           | `--branch`           | ❌        | `main`  |
| `Contentstack_Management_Token` | `--management-token` | ✅        | N/A     |
| `Beacon_Extension`              | `--extension`        | ❌        | N/A     |
| `Beacon_Plugin`                 | `--json-rte-plugin`  | ❌        | N/A     |

### Configuration File (`beacon.yaml`)

The YAML configuration file allows for additional options.

Example:

```yaml
# yaml-language-server: $schema=node_modules/@arke-systems/beacon-cli/dist/cfg/Config.schema.yaml

schema:
  client:
    api-key: bltcfcf264c-example
    management-token: cs-example
    branch: main
    base-url: https://api.contentstack.io/
    timeout: 10000

  schema:
    properties:
      deletion-strategy: delete # delete | ignore | warn
      schema-path: ./cs/schema

      extension:
        Bynder: blt6b7c082b-example

      json-rte-plugin:
        Bynder: bltdd6396f0-example

      # Include or exclude assets using glob patterns.
      assets:
        include: ['**']
        exclude: []

      # Determine whether to serialize taxonomy terms or just the
      # taxonomy structure.
      taxonomies:
        page_type: taxonomy and terms
        '*': only taxonomy

  verbose: false
```

## Examples

### Pulling Content from a Stack

```sh
yarn beacon pull \
  --api-key bltcfcf264c-example \
  --management-token cs-example \
  --base-url https://api.contentstack.io
```

### Pushing Content to a Stack

```sh
yarn beacon push \
  --api-key bltcfcf264c-example \
  --management-token cs-example \
  --base-url https://api.contentstack.io
```

### Clearing a Stack

```sh
yarn beacon clear \
  --api-key bltcfcf264c-example \
  --management-token cs-example \
  --base-url https://api.contentstack.io
```

### Cookbook: Project Configuration

The recommended configuration for incorporating Beacon into a project is to
store any stack-specific settings in the project's `.env` file, outside of
source control. Any shared team settings can then be stored in the `beacon.yaml`
file, which should be committed to source control. This permits individual
developers to target their personal stack and also permits CI/CD tooling to
operate effectively on higher environments.

For example:

```sh
# .env (ignored by Git)
Contentstack_Api_Key=bltcfcf264c-example
Contentstack_Management_API=https://api.contentstack.io/
Contentstack_Management_Token=cs-example
Beacon_Extension=Bynder:blt6b7c082b-example
Beacon_Plugin=Bynder:bltdd6396f0-example
```

```sh
# .env.example (committed to Git)
Contentstack_Api_Key=
Contentstack_Management_API=https://api.contentstack.io/
Contentstack_Management_Token=
Beacon_Extension=
Beacon_Plugin=
```

```yaml
# beacon.yaml
schema:
  schema-path: ./cs/schema

  assets:
    include:
      - Chrome/**
      - Errors/404.jpg
      - Logo/logo-412.webp
    taxonomies:
      page_type: 'taxonomy and terms'
      '*': only taxonomy
```

```yaml
# .yarnrc.yml
injectEnvironmentFiles: [.env?]
```

Under this configuration, the push, pull, and clear commands become:

```sh
yarn beacon pull
yarn beacon push
yarn beacon clear
```

For CI/CD environments, the `.env` file will not exist, so environment variables
should be set by the CI/CD tooling instead.

## Development

This project uses [yarn][1] as a package manager. Use `yarn install` to install
the dependencies.

To test locally, you will need an `.env` file. Copy the `.env.example` file to
create your own `.env` file.

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

## License

Beacon is licensed under the MIT License.

[1]: https://yarnpkg.com/
[2]: https://github.com/Arke-Systems/beacon/releases/new
[3]: https://yarnpkg.com/configuration/yarnrc#injectEnvironmentFiles

