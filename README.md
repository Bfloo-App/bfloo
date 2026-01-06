# bfloo

Manage database schemas like code. Version control, team collaboration, and seamless migrations.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Commands](#commands)
- [Configuration](#configuration)
- [Project Structure](#project-structure)
- [Development](#development)
- [License](#license)

## Overview

bfloo is a CLI tool that brings version control workflows to database schema management. It allows teams to:

- **Track schema changes** with snapshots and version history
- **Collaborate** by syncing schemas across team members via a remote API
- **Manage multiple schemas** in a single project with local identifiers
- **Review changes** before applying them to your database

Currently supports **PostgreSQL** with more database engines coming soon.

## Installation

### Using the install script (recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/Bfloo-App/bfloo/main/scripts/install.sh | bash
```

To install a specific version:

```bash
curl -fsSL https://raw.githubusercontent.com/Bfloo-App/bfloo/main/scripts/install.sh | bash -s -- v1.0.0
```

### Manual installation

Download the appropriate binary for your platform from the [releases page](https://github.com/Bfloo-App/bfloo/releases) and add it to your PATH.

### Uninstall

```bash
curl -fsSL https://raw.githubusercontent.com/Bfloo-App/bfloo/main/scripts/uninstall.sh | bash
```

## Quick Start

1. **Initialize a project** with your API key:

```bash
bfloo init
```

You'll be prompted to enter your API key and confirm the schema details. The command will:

- Create a `.bfloo/` directory for internal state
- Create a `bfloo.yml` configuration file
- Fetch and store schema snapshots from the remote

2. **Review your schema** in the generated working file (default: `schema/<name>.bfloo.yml`)

3. **Make changes** to your schema and sync them back to the remote (coming soon)

## Commands

### `bfloo init`

Initialize a new bfloo project by connecting to a remote schema.

```bash
bfloo init [options]
```

**Options:**

| Option                  | Description                                            |
| ----------------------- | ------------------------------------------------------ |
| `-k, --key <key>`       | API key for authentication                             |
| `-l, --local-key <key>` | Local identifier for the schema                        |
| `-d, --dir <path>`      | Directory for working schema files (default: `schema`) |
| `-r, --reinit`          | Re-initialize and clear existing state                 |
| `-y, --yes`             | Skip all confirmation prompts                          |
| `--dry-run`             | Simulate actions without making changes                |
| `-q, --quiet`           | Suppress output (requires `--key` and `--yes`)         |

**Examples:**

```bash
# Interactive initialization
bfloo init

# Non-interactive with API key
bfloo init --key "bfloo_abc123..." --yes

# Re-initialize existing project
bfloo init --reinit

# Preview what would happen
bfloo init --key "bfloo_abc123..." --dry-run
```

### Global Options

| Option          | Description                         |
| --------------- | ----------------------------------- |
| `-v, --verbose` | Enable verbose output for debugging |
| `--json`        | Output errors in JSON format        |
| `--help`        | Display help information            |
| `--version`     | Display version number              |

## Configuration

### `bfloo.yml`

The main configuration file is created in your project root:

```yaml
schemas:
  my-database:
    dir: schema
    key: bfloo_abc123...
    engine: PostgreSQL
    envs: {}
```

**Fields:**

- `schemas` - Map of local schema identifiers to their configurations
  - `dir` - Directory containing working schema files
  - `key` - API key for remote synchronization
  - `engine` - Database engine (e.g., `PostgreSQL`)
  - `envs` - Environment-specific overrides (optional)

### Environment Variables

For security, you can reference environment variables in your config using `${VAR_NAME}` syntax:

```yaml
schemas:
  production:
    key: ${BFLOO_API_KEY}
    # ...
```

## Project Structure

After initialization, your project will have:

```
your-project/
├── .bfloo/                    # Internal state (git-ignored recommended)
│   └── <schema-key>/
│       ├── manifest.yml       # Snapshot metadata and history
│       └── snapshots/         # Stored snapshot files
├── schema/                    # Working schema files (configurable)
│   └── <schema-key>.bfloo.yml # Current working snapshot
└── bfloo.yml                  # Project configuration
```

### Working Snapshot Format

The working snapshot file (`<schema-key>.bfloo.yml`) contains your current schema state:

```yaml
schema:
  name: My Database
  description: Production database schema

snapshot:
  label: v1.0.0
  engine-version: '15.0'
  description: Initial schema
  tables:
    - name: users
      columns:
        - name: id
          type: uuid
          nullable: false
        - name: email
          type: varchar(255)
          nullable: false
      # ... constraints, indexes, etc.
```

## Development

### Prerequisites

- [Bun](https://bun.sh/) (latest version)

### Setup

```bash
# Clone the repository
git clone https://github.com/Bfloo-App/bfloo.git
cd bfloo

# Install dependencies
bun install

# Run in development mode
bun dev
```

### Scripts

| Script                 | Description                  |
| ---------------------- | ---------------------------- |
| `bun dev`              | Run CLI in watch mode        |
| `bun run build`        | Build for distribution       |
| `bun run build:binary` | Build standalone binary      |
| `bun test`             | Run tests in watch mode      |
| `bun test:run`         | Run tests once               |
| `bun lint`             | Run ESLint                   |
| `bun format`           | Format code with Prettier    |
| `bun typecheck`        | Run TypeScript type checking |

### Project Structure

```
src/
├── api/           # API client for remote communication
├── commands/      # CLI command implementations
├── constants/     # Shared constants and defaults
├── error/         # Error handling and CliError class
├── execution/     # ExecutionPlan for transactional operations
├── fs/            # File system operations
├── schemas/       # Zod schemas for validation
├── ui/            # CLI output formatting and spinners
└── utils/         # Utility functions
```

## License

MIT License - see [LICENSE](LICENSE) for details.
