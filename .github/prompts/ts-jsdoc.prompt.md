# TypeScript JSDoc Documentation Guidelines

This document defines the standard for TypeScript JSDoc comments in this codebase. Follow these guidelines when documenting TypeScript code.

## Import Organization

Organize imports into categories with clear section comments:

```typescript
// Package imports
import { Command } from 'commander';
import type { ExternalType } from 'some-package';

// Project imports
import { createCli } from './cli.js';
import type { CustomType } from './types.js';
```

## Documentation Patterns

### Functions

Document purpose, parameters, return value, and exceptions. Use markdown-style lists for parameters.

```typescript
/**
 * ### createMigrateCommand
 *
 * Creates the migrate command for database schema migrations.
 *
 * Parameters:
 * - `options` - Migration command configuration options
 *
 * @returns `Command` - see {@link Command}
 *
 * @throws `MigrationError` - When migration files are invalid
 */
function createMigrateCommand(options?: MigrateOptions): Command {
  // implementation
}
```

### Interfaces

Document purpose and all fields. Use "Fields:" prefix and indent nested structures.

```typescript
/**
 * ### MigrationConfig
 *
 * Configuration for database migration operations.
 *
 * Fields:
 * - `directory` - Path to migration files
 * - `database` - Database connection settings
 *   - `host` - Database host
 *   - `port` - Database port
 *   - `name` - Database name
 * - `dryRun` - Execute without applying changes (optional)
 */
interface MigrationConfig {
  directory: string;
  database: {
    host: string;
    port: number;
    name: string;
  };
  dryRun?: boolean;
}
```

### Type Aliases (Simple Union Types)

Use "Variants:" for enum-like string literals or union types.

```typescript
/**
 * ### DatabaseProvider
 *
 * Supported database providers.
 *
 * Variants:
 * - `postgres` - PostgreSQL database
 * - `mysql` - MySQL database
 * - `sqlite` - SQLite database
 */
export type DatabaseProvider = 'postgres' | 'mysql' | 'sqlite';
```

### Type Aliases (Complex Types)

Use "Fields:" or "Structure:" for object types and complex unions.

```typescript
/**
 * ### ConnectionOptions
 *
 * Database connection configuration options.
 *
 * Fields:
 * - `host` - Database server hostname
 * - `port` - Database server port
 * - `user` - Database username
 * - `password` - Database password (optional)
 * - `ssl` - Enable SSL connection (optional)
 */
export type ConnectionOptions = {
  host: string;
  port: number;
  user: string;
  password?: string;
  ssl?: boolean;
};
```

### Enums

Use "Options:" prefix to document all enum members.

```typescript
/**
 * ### MigrationStatus
 *
 * Status of a database migration.
 *
 * Options:
 * - `PENDING` - Migration has not been applied
 * - `APPLIED` - Migration has been successfully applied
 * - `FAILED` - Migration failed during execution
 * - `ROLLED_BACK` - Migration was rolled back
 */
enum MigrationStatus {
  PENDING = 'pending',
  APPLIED = 'applied',
  FAILED = 'failed',
  ROLLED_BACK = 'rolled_back'
}
```

### Classes

Document class purpose, constructor parameters, and key methods.

```typescript
/**
 * ### SchemaManager
 *
 * Manages database schema operations and migrations.
 *
 * Constructor Parameters:
 * - `config` - Schema manager configuration
 * - `provider` - Database provider instance
 *
 * @throws `ConfigError` - When configuration is invalid
 */
class SchemaManager {
  constructor(config: SchemaConfig, provider: DatabaseProvider) {
    // implementation
  }

  /**
   * ### apply
   *
   * Applies pending migrations to the database.
   *
   * Parameters:
   * - `options` - Apply options (optional)
   *
   * @returns `Promise<MigrationResult[]>` - see {@link MigrationResult}
   *
   * @throws `MigrationError` - When migration fails
   */
  async apply(options?: ApplyOptions): Promise<MigrationResult[]> {
    // implementation
  }
}
```

### Constants

Document purpose and structure for complex constants.

```typescript
/**
 * ### DEFAULT_CONFIG
 *
 * Default configuration values for the CLI.
 */
export const DEFAULT_CONFIG = {
  migrationsDir: './migrations',
  timeout: 30000,
  retries: 3
} as const;
```

### Extended/Inherited Types

Use {@link} to reference parent types.

```typescript
/**
 * ### PostgresConfig
 *
 * PostgreSQL-specific connection configuration.
 *
 * Fields:
 * - `schema` - Database schema name
 * - `poolSize` - Connection pool size
 * - See inherited fields from {@link ConnectionOptions}
 */
interface PostgresConfig extends ConnectionOptions {
  schema: string;
  poolSize: number;
}
```

### Generic Types

Document type parameters and their constraints.

```typescript
/**
 * ### Result
 *
 * Generic result type for operations that can fail.
 *
 * Type Parameters:
 * - `T` - Success value type
 * - `E` - Error type (defaults to Error)
 *
 * Variants:
 * - `success` - Operation succeeded with data
 * - `failure` - Operation failed with error
 */
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };
```

## Documentation Rules

### Core Principles

1. **Brevity**: Keep descriptions to 1-2 sentences maximum
2. **Present Tense**: Use present tense for all descriptions
3. **No Speculation**: Document only existing functionality, not planned features
4. **Consistency**: Follow patterns exactly as shown in examples

### Section Prefixes

- Functions/Methods: Use "Parameters:", "@returns", "@throws"
- Interfaces/Object Types: Use "Fields:"
- Simple Union Types: Use "Variants:"
- Enums: Use "Options:"
- Classes: Use "Constructor Parameters:" for constructors
- Generic Types: Use "Type Parameters:"

### Cross-References

Always use `{@link TypeName}` when referencing other types, interfaces, or functions:

```typescript
/**
 * @returns `Promise<Migration>` - see {@link Migration}
 */
```

### Nested Structures

Indent nested fields to show hierarchy:

```typescript
/**
 * Fields:
 * - `connection` - Database connection
 *   - `host` - Server hostname
 *   - `credentials` - Auth credentials
 *     - `user` - Username
 *     - `password` - Password
 */
```

### Optional Fields

Explicitly mark optional fields in documentation:

```typescript
/**
 * Fields:
 * - `required` - This field is required
 * - `optional` - This field is optional (optional)
 */
```

## When to Document

- **Always document**: Exported functions, types, interfaces, classes, enums, constants
- **Consider documenting**: Complex internal functions, utility types, helper classes
- **Skip documenting**: Trivial getters/setters, obvious one-line functions, test utilities, **index files**

### Index Files

Index files (`index.ts`) should **NOT** have JSDoc documentation. They use a standard comment pattern:

```typescript
// Re-export all module contents to make them available from '$utils'

export { createHelloCommand } from './hello';
export { createMigrateCommand } from './migrate';
```

## Anti-Patterns (Avoid These)

**Dot notation for nested properties**:

```typescript
/**
 * Parameters:
 * - `config.host` - Database host
 */
```

**Correct** (use indented nesting):

```typescript
/**
 * Parameters:
 * - `config` - Configuration object
 *   - `host` - Database host
 */
```

**NEVER use `parent.child` dot notation. ALWAYS use indented nesting to show hierarchy.**

---

**Too verbose**: "This function takes a string parameter called name which represents the migration name and creates it"

**Correct**: "Creates a new migration file with the given name"

---

**Missing structure**:

```typescript
/**
 * Migration data
 */
```

**Correct**:

```typescript
/**
 * ### Migration
 *
 * Database migration record.
 *
 * Fields:
 * - `id` - Migration identifier
 * - `name` - Migration name
 */
```

---

**No cross-references**:

```typescript
/**
 * @returns Promise<Migration>
 */
```

**Correct**:

```typescript
/**
 * @returns `Promise<Migration>` - see {@link Migration}
 */
```

## Summary

- Start with ### heading using declaration name
- Provide concise 1-2 sentence description
- Use appropriate section prefix (Fields:, Parameters:, Variants:, Options:)
- Document all parameters, fields, and return values
- Use `{@link}` for cross-references
- Mark optional items explicitly
- Keep formatting consistent with examples
