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
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  spyOn,
  mock
} from 'bun:test';

// Project imports
import { createCli } from '../src/cli';
import * as fsModule from '../src/fs/config';
import * as apiModule from '../src/api/client';

describe('[Integration] - CLI Migration Flow', () => {
  // Setup and teardown go here
  // Mock dependencies using spyOn for individual functions
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

Test complete command execution with all components using spies on internal modules.

```typescript
describe('[Integration] - migrate command', () => {
  let configSpy: ReturnType<typeof spyOn>;
  let dbSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    // Mock internal fs/config module functions
    configSpy = spyOn(fsModule, 'readConfig').mockReturnValue({
      database: 'postgres://localhost:5432/test',
      migrationsDir: './migrations'
    });

    // Mock database module
    dbSpy = spyOn(dbModule, 'connect').mockResolvedValue({
      query: mock(),
      release: mock()
    });
  });

  afterEach(() => {
    configSpy.mockRestore();
    dbSpy.mockRestore();
  });

  it('should execute migration with valid config', async () => {
    const cli = createCli();
    const consoleSpy = spyOn(console, 'log').mockImplementation(() => {});

    await cli.parseAsync(['node', 'rune', 'migrate', 'up']);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Migration complete')
    );
    consoleSpy.mockRestore();
  });

  it('should fail gracefully without config file', async () => {
    configSpy.mockImplementation(() => {
      throw new Error('Config file not found');
    });

    const cli = createCli();
    const consoleSpy = spyOn(console, 'error').mockImplementation(() => {});

    await expect(
      cli.parseAsync(['node', 'rune', 'migrate', 'up'])
    ).rejects.toThrow();

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Config file not found')
    );
    consoleSpy.mockRestore();
  });
});
```

### 2. **Configuration Integration Tests**

Test config loading and validation flow using spies.

```typescript
import * as fsConfigModule from '../src/fs/config';

describe('[Integration] - Configuration Loading', () => {
  let readConfigSpy: ReturnType<typeof spyOn>;
  let writeConfigSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    readConfigSpy = spyOn(fsConfigModule, 'readConfig');
    writeConfigSpy = spyOn(fsConfigModule, 'writeConfig').mockImplementation(
      () => {}
    );
  });

  afterEach(() => {
    readConfigSpy.mockRestore();
    writeConfigSpy.mockRestore();
  });

  it('should load and validate config from file', async () => {
    readConfigSpy.mockReturnValue({
      database: 'postgres://localhost:5432/test',
      migrationsDir: './migrations'
    });

    const config = loadConfig('./rune.config.json');

    expect(config.database).toBe('postgres://localhost:5432/test');
    expect(config.migrationsDir).toBe('./migrations');
  });

  it('should merge config with CLI options', async () => {
    readConfigSpy.mockReturnValue({
      database: 'postgres://localhost:5432/test',
      migrationsDir: './migrations'
    });

    const config = loadConfig('./rune.config.json', {
      database: 'postgres://localhost:5432/override'
    });

    expect(config.database).toBe('postgres://localhost:5432/override');
  });

  it('should throw on invalid config schema', async () => {
    readConfigSpy.mockImplementation(() => {
      throw new Error('Invalid configuration');
    });

    expect(() => loadConfig('./rune.config.json')).toThrow(
      'Invalid configuration'
    );
  });
});
```

### 3. **File System Integration Tests**

Test file operations by mocking the fs module functions directly.

```typescript
import * as fsSnapshotModule from '../src/fs/snapshot';
import * as fsManifestModule from '../src/fs/manifest';

describe('[Integration] - Migration File Operations', () => {
  let writeSnapshotSpy: ReturnType<typeof spyOn>;
  let readSnapshotSpy: ReturnType<typeof spyOn>;
  let listSnapshotsSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    writeSnapshotSpy = spyOn(
      fsSnapshotModule,
      'writeStoredSnapshot'
    ).mockImplementation(() => {});

    readSnapshotSpy = spyOn(fsSnapshotModule, 'readStoredSnapshot');

    listSnapshotsSpy = spyOn(
      fsManifestModule,
      'getSnapshotsDir'
    ).mockReturnValue('/test/.bfloo/schema/snapshots');
  });

  afterEach(() => {
    writeSnapshotSpy.mockRestore();
    readSnapshotSpy.mockRestore();
    listSnapshotsSpy.mockRestore();
  });

  it('should create migration file with correct structure', async () => {
    await createMigration('create_users', './migrations');

    expect(writeSnapshotSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}_create_users\.yml$/),
      expect.objectContaining({
        tables: expect.any(Array)
      })
    );
  });

  it('should list pending migrations in order', async () => {
    // Mock the manifest to return specific snapshots
    const mockManifest = {
      'schema-id': 'test-id',
      snapshots: {
        'id-1': { label: 'first', file: '2024-01-01_first.yml' },
        'id-2': { label: 'second', file: '2024-01-02_second.yml' },
        'id-3': { label: 'third', file: '2024-01-03_third.yml' }
      }
    };

    spyOn(fsManifestModule, 'readManifest').mockReturnValue(mockManifest);

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
      query: mock(),
      release: mock(),
      connect: mock()
    };

    spyOn(DatabasePool, 'connect').mockResolvedValue(mockClient);
  });

  afterEach(() => {
    mock.restore();
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

Test error handling across layers using spies.

```typescript
import * as apiModule from '../src/api/client';
import * as fsConfigModule from '../src/fs/config';

describe('[Integration] - Error Propagation', () => {
  let configSpy: ReturnType<typeof spyOn>;
  let apiSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    configSpy = spyOn(fsConfigModule, 'readConfig').mockReturnValue({
      database: 'postgres://localhost:5432/test'
    });
  });

  afterEach(() => {
    configSpy.mockRestore();
    if (apiSpy) apiSpy.mockRestore();
  });

  it('should propagate database errors to CLI', async () => {
    apiSpy = spyOn(apiModule.ApiClient.schema, 'getByApiKey').mockRejectedValue(
      new Error('Connection refused')
    );

    const cli = createCli();
    const exitSpy = spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });

    await expect(
      cli.parseAsync(['node', 'rune', 'migrate', 'up'])
    ).rejects.toThrow();

    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });

  it('should show user-friendly error messages', async () => {
    configSpy.mockImplementation(() => {
      throw new Error('Invalid database URL');
    });

    const cli = createCli();
    const consoleSpy = spyOn(console, 'error').mockImplementation(() => {});

    await expect(
      cli.parseAsync(['node', 'rune', 'migrate', 'up'])
    ).rejects.toThrow();

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Invalid database URL')
    );
    consoleSpy.mockRestore();
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

### Mock File System Operations with spyOn

Instead of using memfs (which requires an additional dependency), mock the file system
functions from your own modules using `spyOn`:

```typescript
import * as fsConfigModule from '../src/fs/config';
import * as fsPathsModule from '../src/fs/paths';

let configSpy: ReturnType<typeof spyOn>;
let pathsSpy: ReturnType<typeof spyOn>;

beforeEach(() => {
  // Mock your fs wrapper functions
  configSpy = spyOn(fsConfigModule, 'readConfig').mockReturnValue({
    key: 'value'
  });

  pathsSpy = spyOn(fsPathsModule, 'findProjectRoot').mockReturnValue(null);
});

afterEach(() => {
  configSpy.mockRestore();
  pathsSpy.mockRestore();
});
```

### Mock fs Module Directly (when needed)

For low-level fs operations, use `mock.module`:

```typescript
beforeEach(() => {
  mock.module('fs', () => ({
    existsSync: () => false,
    mkdirSync: () => {},
    rmSync: () => {},
    readFileSync: () => '',
    writeFileSync: () => {}
  }));
});

afterEach(() => {
  mock.restore();
});
```

### Mock Database Connections

```typescript
let mockClient: MockClient;

beforeEach(() => {
  mockClient = {
    query: mock(),
    release: mock()
  };
  spyOn(Pool.prototype, 'connect').mockResolvedValue(mockClient);
});
```

### Test CLI Output

```typescript
it('should output success message', async () => {
  const consoleSpy = spyOn(console, 'log').mockImplementation(() => {});

  await cli.parseAsync(['node', 'rune', 'status']);

  expect(consoleSpy).toHaveBeenCalledWith(
    expect.stringMatching(/migrations applied/i)
  );
});
```

### Test Exit Codes

```typescript
it('should exit with code 1 on error', async () => {
  const exitSpy = spyOn(process, 'exit').mockImplementation(() => {
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
- [ ] Mock external services (database, network, API)
- [ ] Use spyOn for mocking internal module functions
- [ ] Use mock.module for low-level Node.js module mocking when needed
- [ ] Proper setup/teardown for test isolation
- [ ] Test both success and error scenarios
- [ ] Verify transaction management (BEGIN, COMMIT, ROLLBACK)
- [ ] Test error propagation
- [ ] Verify resource cleanup
- [ ] **NEVER bypass the type system or use `any` type unless absolutely necessary**
- [ ] **ALWAYS run tests after writing them: `bun test:run`**
- [ ] **ALWAYS run linting after writing tests: `bun lint`**
- [ ] **ALWAYS run type checks after writing tests: `bun typecheck`**
- [ ] **Fix all errors from tests, linting, and type checking before considering the task complete**
- [ ] **Coverage threshold: Aim for 80% coverage on functions and lines**

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

- Restore all spies in `afterEach` using `.mockRestore()`
- Use `mock.restore()` to clean up module mocks
- Use connection pooling mocks
- Avoid actual network calls
- Keep tests focused and fast

## Common Patterns

### Mock Process Exit

```typescript
const exitSpy = spyOn(process, 'exit').mockImplementation(() => {
  throw new Error('process.exit');
});
```

### Mock Environment Variables

```typescript
beforeEach(() => {
  process.env.DATABASE_URL = 'postgres://test:test@localhost/test';
});

afterEach(() => {
  delete process.env.DATABASE_URL;
});
```

### Capture CLI Output

```typescript
let stdout: string[] = [];
let stderr: string[] = [];

beforeEach(() => {
  stdout = [];
  stderr = [];
  spyOn(console, 'log').mockImplementation((...args) =>
    stdout.push(args.join(' '))
  );
  spyOn(console, 'error').mockImplementation((...args) =>
    stderr.push(args.join(' '))
  );
});
```
