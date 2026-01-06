# Agent Guidelines for bfloo

This document provides context for AI coding agents working on the bfloo codebase.

## Project Overview

bfloo is a CLI tool for database schema management. It allows teams to version control database schemas, collaborate via a remote API, and manage migrations.

**Key concepts:**

- **Schema** - A database schema tracked by bfloo (e.g., a PostgreSQL database)
- **Snapshot** - A point-in-time capture of a schema's structure (tables, columns, constraints)
- **Working snapshot** - The current editable schema file in the project
- **Stored snapshot** - Historical snapshots saved in `.bfloo/`
- **Manifest** - Metadata file tracking snapshot history and sync state
- **Local key** - User-defined identifier for a schema within a project (e.g., `my-database`)

## Technology Stack

- **Runtime**: Bun
- **Language**: TypeScript (strict mode)
- **CLI Framework**: Commander.js
- **Validation**: Zod v4
- **Prompts**: @inquirer/prompts
- **Output**: picocolors, ora (spinners)
- **Config Format**: YAML

## Project Structure

```
src/
├── api/              # API client for remote communication
│   ├── handlers/     # Request handlers by resource type
│   ├── client.ts     # Main ApiClient export
│   ├── config.ts     # API configuration (base URL, etc.)
│   └── router.ts     # Route definitions
├── commands/         # CLI command implementations
│   └── init/         # Each command has its own folder
│       ├── cmd.ts    # Commander command definition
│       ├── handlers.ts  # Business logic
│       └── index.ts  # Exports
├── constants/        # Shared constants
│   ├── api.ts        # API-related constants
│   ├── databaseRegistry.ts  # Supported engines
│   └── paths.ts      # File/directory paths
├── error/            # Error handling
│   ├── CliError.ts   # Custom error class with UI support
│   ├── handlers.ts   # Global error handlers
│   └── outputOptions.ts  # --verbose, --json flags
├── execution/        # Transactional execution
│   └── ExecutionPlan.ts  # Step-by-step execution with rollback
├── fs/               # File system operations
│   ├── config.ts     # bfloo.yml read/write
│   ├── manifest.ts   # manifest.yml operations
│   ├── paths.ts      # Path resolution helpers
│   ├── snapshot.ts   # Snapshot file operations
│   └── yaml.ts       # YAML formatting utilities
├── schemas/          # Zod validation schemas
│   ├── config/       # bfloo.yml schema
│   ├── manifest/     # manifest.yml schema
│   ├── postgresql/   # PostgreSQL-specific schemas
│   ├── schema/       # Remote schema response
│   ├── schemaApiKey/ # API key validation
│   └── schemaSnapshot/  # Snapshot schemas
├── ui/               # CLI output utilities
│   └── printer.ts    # Formatted output, spinners, error boxes
├── utils/            # General utilities
│   ├── env.ts        # Environment variable resolution
│   ├── fetch.ts      # Fetch with timeout
│   └── hash.ts       # Content hashing
├── cli.ts            # Root CLI command setup
└── index.ts          # Entry point
```

## Code Conventions

### Import Organization

Imports are organized into sections with comments:

```typescript
// Package imports
import { Command } from 'commander';
import type z from 'zod';

// Project imports
import { CliError } from '$error';
import { printer } from '$ui';
```

### Path Aliases

The project uses TypeScript path aliases defined in `tsconfig.json`:

- `$api` → `src/api`
- `$commands` → `src/commands`
- `$constants` → `src/constants`
- `$error` → `src/error`
- `$execution` → `src/execution`
- `$fs` → `src/fs`
- `$schemas` → `src/schemas`
- `$ui` → `src/ui`
- `$utils` → `src/utils`

### JSDoc Documentation

All exports must be documented following `.github/prompts/ts-jsdoc.prompt.md`. Key patterns:

```typescript
/**
 * ### functionName
 *
 * Brief description of what this does.
 *
 * Parameters:
 * - `param1` - Description
 * - `param2` - Description (optional)
 *
 * @returns `ReturnType` - see {@link TypeReference}
 *
 * @throws `ErrorType` - When this happens
 */
```

### Error Handling

Use `CliError` for user-facing errors:

```typescript
throw new CliError({
  title: 'Short error title',
  message: 'Detailed explanation',
  code: 'OPTIONAL_CODE',
  suggestions: ['Actionable suggestion 1', 'Suggestion 2'],
  hints: ['Additional context'],
  cause: originalError // For error chaining
});
```

### Execution Plan Pattern

For operations that need rollback support, use `ExecutionPlan`:

```typescript
const plan = new ExecutionPlan();

plan.add({
  name: 'Step description',
  exec: {
    action: () => {
      /* do work */
    },
    dryAction: () => {
      /* describe what would happen */
    }
  },
  rollback: {
    action: () => {
      /* undo work */
    },
    failMsg: 'Message if rollback fails'
  }
});

await plan.run({ dry: dryRun });
```

### Zod Schema Naming

- Schema validators end with `_Schema`: `BflooConfig_Schema`
- Property validators end with `Prop`: `Config_LocalKeyProp`
- Use `z.infer<typeof Schema>` for types

## Testing Guidelines

See `.github/prompts/ts-unit-tests.prompt.md` and `.github/prompts/ts-integration-tests.prompt.md` for testing conventions.

- Tests are in `tests/` directory
- Use Bun's built-in test runner
- Run with `bun test` (watch) or `bun test:run` (once)

## Commands Structure

Each command lives in `src/commands/<name>/`:

- `cmd.ts` - Commander command definition with options
- `handlers.ts` - Business logic (the actual work)
- `index.ts` - Re-exports

Commands are registered in `src/commands/index.ts` and added to the CLI in `src/cli.ts`.

## Key Files

| File                             | Purpose                               |
| -------------------------------- | ------------------------------------- |
| `src/cli.ts`                     | Root CLI setup, global options        |
| `src/index.ts`                   | Entry point, error handling           |
| `src/error/CliError.ts`          | Custom error class for CLI            |
| `src/execution/ExecutionPlan.ts` | Transactional execution with rollback |
| `src/ui/printer.ts`              | All CLI output formatting             |
| `src/fs/paths.ts`                | Path resolution for all bfloo files   |
| `src/schemas/index.ts`           | All Zod schema exports                |

## Common Tasks

### Adding a New Command

1. Create folder `src/commands/<name>/`
2. Create `cmd.ts` with Commander definition
3. Create `handlers.ts` with business logic
4. Create `index.ts` to export
5. Add to `src/commands/index.ts`
6. Register in `src/cli.ts`

### Adding a New Schema

1. Create Zod schema in `src/schemas/<domain>/`
2. Export from `src/schemas/index.ts`
3. Use with `z.infer<typeof Schema>` for types

### Adding a New API Endpoint

1. Create handler in `src/api/handlers/<resource>/`
2. Add route to `src/api/router.ts`
3. Export from `src/api/handlers/index.ts`

## Lint & Format

- ESLint with TypeScript rules (strict)
- Prettier for formatting
- Pre-commit hooks via Husky + lint-staged
- Run `bun lint` and `bun format` before committing
