# TypeScript Integration Test Generator

Generate comprehensive integration tests for TypeScript CLI applications using this project's testing patterns.

## Goal

Create focused integration tests that verify **interactions between multiple system components**, including CLI command execution, file system operations, database connections, and configuration loading.

## Test Structure Template

**File Naming Convention:**

- Integration tests: `*.integration.test.ts`

**File Organization:**

Mirror the source directory structure in the `tests/` directory:

```
/src/commands/migrate.ts
→ /tests/commands/migrate.test.ts (unit test)
→ /tests/commands/migrate.integration.test.ts (integration test)
```

```typescript
// Package imports
import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach
} from 'vitest';
import { vol } from 'memfs';

// Project imports
import { createCli } from '../src/cli.js';

// Mock file system
vi.mock('fs/promises');

describe('[Integration] - CLI Migration Flow', () => {
  // Setup and teardown go here
});
```

## What is Integration Testing?

### Integration vs Unit Testing

**Unit Tests:**

- Test individual functions/components in isolation
- Mock all dependencies
- Fast execution
- Focus: "Does this function work correctly?"

**Integration Tests:**

- Test multiple components working together
- Mock external services (database, file system) but test internal interactions
- Focus on command flows, configuration loading, error propagation
- Focus: "Do these components work together correctly?"

### When to Write Integration Tests

Write integration tests when testing:

1. **CLI Command Flows** - Full command execution with arguments and options
2. **Configuration Loading** - Config file parsing and validation
3. **File System Operations** - Migration file creation, reading, writing
4. **Database Operations** - Connection, queries, transactions (with mocks)
5. **Multi-Step Workflows** - Commands that involve multiple operations
6. **Error Propagation** - Errors flowing through multiple system layers

## Integration Test Types

### 1. **CLI Command Flow Tests**

Test complete command execution with all components.

```typescript
describe('[Integration] - migrate command', () => {
  let cli: Command;

  beforeEach(() => {
    cli = createCli();
    vol.reset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should execute migration with valid config', async () => {
    // Setup virtual file system
    vol.fromJSON({
      './rune.config.json': JSON.stringify({
        database: 'postgres://localhost:5432/test',
        migrationsDir: './migrations'
      }),
      './migrations/20240101120000_create_users.ts':
        'export const up = () => {};'
    });

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await cli.parseAsync(['node', 'rune', 'migrate', 'up']);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Migration complete')
    );
  });

  it('should fail gracefully without config file', async () => {
    vol.fromJSON({});

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(
      cli.parseAsync(['node', 'rune', 'migrate', 'up'])
    ).rejects.toThrow();

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Config file not found')
    );
  });
});
```

### 2. **Configuration Integration Tests**

Test config loading and validation flow.

```typescript
describe('[Integration] - Configuration Loading', () => {
  beforeEach(() => {
    vol.reset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should load and validate config from file', async () => {
    vol.fromJSON({
      './rune.config.json': JSON.stringify({
        database: 'postgres://localhost:5432/test',
        migrationsDir: './migrations'
      })
    });

    const config = await loadConfig('./rune.config.json');

    expect(config.database).toBe('postgres://localhost:5432/test');
    expect(config.migrationsDir).toBe('./migrations');
  });

  it('should merge config with CLI options', async () => {
    vol.fromJSON({
      './rune.config.json': JSON.stringify({
        database: 'postgres://localhost:5432/test',
        migrationsDir: './migrations'
      })
    });

    const config = await loadConfig('./rune.config.json', {
      database: 'postgres://localhost:5432/override'
    });

    expect(config.database).toBe('postgres://localhost:5432/override');
  });

  it('should throw on invalid config schema', async () => {
    vol.fromJSON({
      './rune.config.json': JSON.stringify({
        invalid: 'config'
      })
    });

    await expect(loadConfig('./rune.config.json')).rejects.toThrow(
      'Invalid configuration'
    );
  });
});
```

### 3. **File System Integration Tests**

Test migration file operations.

```typescript
describe('[Integration] - Migration File Operations', () => {
  beforeEach(() => {
    vol.reset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create migration file with correct structure', async () => {
    vol.fromJSON({
      './migrations': null // directory
    });

    await createMigration('create_users', './migrations');

    const files = vol.readdirSync('./migrations');
    expect(files).toHaveLength(1);
    expect(files[0]).toMatch(/^\d{14}_create_users\.ts$/);

    const content = vol.readFileSync(`./migrations/${files[0]}`, 'utf8');
    expect(content).toContain('export async function up');
    expect(content).toContain('export async function down');
  });

  it('should list pending migrations in order', async () => {
    vol.fromJSON({
      './migrations/20240101120000_first.ts': 'export const up = () => {};',
      './migrations/20240102120000_second.ts': 'export const up = () => {};',
      './migrations/20240103120000_third.ts': 'export const up = () => {};'
    });

    const pending = await listPendingMigrations('./migrations', []);

    expect(pending).toHaveLength(3);
    expect(pending[0]).toContain('first');
    expect(pending[2]).toContain('third');
  });
});
```

### 4. **Database Integration Tests** (with mocks)

Test database operations with mocked connections.

```typescript
describe('[Integration] - Database Operations', () => {
  let mockClient: MockClient;

  beforeEach(() => {
    mockClient = {
      query: vi.fn(),
      release: vi.fn(),
      connect: vi.fn()
    };

    vi.spyOn(DatabasePool, 'connect').mockResolvedValue(mockClient);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should apply migration with transaction', async () => {
    mockClient.query
      .mockResolvedValueOnce({ rows: [] }) // BEGIN
      .mockResolvedValueOnce({ rows: [] }) // migration
      .mockResolvedValueOnce({ rows: [] }) // record migration
      .mockResolvedValueOnce({ rows: [] }); // COMMIT

    await applyMigration(mockClient, {
      name: '20240101120000_create_users',
      up: async () => {}
    });

    expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
    expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
  });

  it('should rollback on migration error', async () => {
    mockClient.query
      .mockResolvedValueOnce({ rows: [] }) // BEGIN
      .mockRejectedValueOnce(new Error('Migration failed')); // migration error

    await expect(
      applyMigration(mockClient, {
        name: '20240101120000_failing',
        up: async () => {
          throw new Error('Migration failed');
        }
      })
    ).rejects.toThrow('Migration failed');

    expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
  });
});
```

### 5. **Error Propagation Tests**

Test error handling across layers.

```typescript
describe('[Integration] - Error Propagation', () => {
  let cli: Command;

  beforeEach(() => {
    cli = createCli();
    vol.reset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should propagate database errors to CLI', async () => {
    vol.fromJSON({
      './rune.config.json': JSON.stringify({
        database: 'postgres://localhost:5432/test'
      })
    });

    vi.spyOn(DatabasePool, 'connect').mockRejectedValue(
      new Error('Connection refused')
    );

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });

    await expect(
      cli.parseAsync(['node', 'rune', 'migrate', 'up'])
    ).rejects.toThrow();

    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should show user-friendly error messages', async () => {
    vol.fromJSON({
      './rune.config.json': JSON.stringify({
        database: 'invalid-url'
      })
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(
      cli.parseAsync(['node', 'rune', 'migrate', 'up'])
    ).rejects.toThrow();

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Invalid database URL')
    );
  });
});
```

## Core Test Categories

### 1. **Command Execution Flow**

- Full CLI command with arguments and options
- Config loading and merging
- Output and exit codes

### 2. **File System Interactions**

- Migration file creation
- Config file reading
- Directory operations

### 3. **Database Operations**

- Connection management
- Transaction handling
- Query execution

### 4. **Error Handling**

- Graceful error messages
- Exit codes
- Cleanup on failure

### 5. **Multi-Component Workflows**

- End-to-end command flows
- State management
- Resource cleanup

## Testing Patterns

### Setup Virtual File System

```typescript
import { vol } from 'memfs';

vi.mock('fs/promises');

beforeEach(() => {
  vol.reset();
  vol.fromJSON({
    './config.json': JSON.stringify({ key: 'value' }),
    './migrations': null
  });
});
```

### Mock Database Connections

```typescript
let mockClient: MockClient;

beforeEach(() => {
  mockClient = {
    query: vi.fn(),
    release: vi.fn()
  };
  vi.spyOn(Pool.prototype, 'connect').mockResolvedValue(mockClient);
});
```

### Test CLI Output

```typescript
it('should output success message', async () => {
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

  await cli.parseAsync(['node', 'rune', 'status']);

  expect(consoleSpy).toHaveBeenCalledWith(
    expect.stringMatching(/migrations applied/i)
  );
});
```

### Test Exit Codes

```typescript
it('should exit with code 1 on error', async () => {
  const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
    throw new Error('exit');
  });

  await expect(cli.parseAsync(['node', 'rune', 'invalid'])).rejects.toThrow();

  expect(exitSpy).toHaveBeenCalledWith(1);
});
```

## Requirements Checklist

- [ ] Use `[Integration] - featureName` describe format
- [ ] File name ends with `.integration.test.ts`
- [ ] Mirror source structure in tests directory
- [ ] Test multiple components working together
- [ ] Mock external services (database, network)
- [ ] Use memfs for file system mocking
- [ ] Proper setup/teardown for test isolation
- [ ] Test both success and error scenarios
- [ ] Verify transaction management (BEGIN, COMMIT, ROLLBACK)
- [ ] Test error propagation
- [ ] Verify resource cleanup
- [ ] **NEVER bypass the type system or use `any` type unless absolutely necessary**
- [ ] **ALWAYS run tests after writing them: `pnpm test:run`**
- [ ] **ALWAYS run linting after writing tests: `pnpm lint`**
- [ ] **ALWAYS run type checks after writing tests: `pnpm typecheck`**
- [ ] **Fix all errors from tests, linting, and type checking before considering the task complete**

## Test Organization

### For CLI Command Integration:

1. **Setup/Teardown** - File system, mocks
2. **Success Scenarios** - Normal command execution
3. **Error Scenarios** - Invalid input, missing files
4. **Edge Cases** - Empty directories, missing config

### For Database Integration:

1. **Connection Management** - Connect, disconnect
2. **Transaction Flow** - Begin, commit, rollback
3. **Query Execution** - Success and failure
4. **Error Handling** - Connection errors, query errors

### For Multi-Component Workflows:

1. **End-to-End Flow** - Complete command execution
2. **State Management** - Migration tracking
3. **Resource Cleanup** - Connection release, file handles

## Don't Test

- External database behavior
- File system edge cases (permissions, disk full)
- Network behavior
- Third-party library internals

## Performance Guidelines

- Reset virtual file system in `beforeEach`
- Restore all mocks in `afterEach`
- Use connection pooling mocks
- Avoid actual network calls
- Keep tests focused and fast

## Common Patterns

### Mock Process Exit

```typescript
const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
  throw new Error('process.exit');
});
```

### Mock Environment Variables

```typescript
beforeEach(() => {
  vi.stubEnv('DATABASE_URL', 'postgres://test:test@localhost/test');
});

afterEach(() => {
  vi.unstubAllEnvs();
});
```

### Capture CLI Output

```typescript
let stdout: string[] = [];
let stderr: string[] = [];

beforeEach(() => {
  stdout = [];
  stderr = [];
  vi.spyOn(console, 'log').mockImplementation((...args) =>
    stdout.push(args.join(' '))
  );
  vi.spyOn(console, 'error').mockImplementation((...args) =>
    stderr.push(args.join(' '))
  );
});
```
