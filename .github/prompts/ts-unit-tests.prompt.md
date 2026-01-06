# TypeScript Unit Test Generator

Generate comprehensive unit tests for TypeScript utility functions and CLI commands using this project's testing patterns.

## Goal

Create focused unit tests that verify **TypeScript utility behavior** in isolation, including pure functions, CLI commands, type guards, and helper utilities.

## Test Structure Template

**File Naming Convention:**

- All unit tests: `*.test.ts`

**File Organization:**

Mirror the source directory structure in the `tests/` directory:

```
/src/commands/hello.ts
→ /tests/commands/hello.test.ts

/src/utils/format.ts
→ /tests/utils/format.test.ts
```

```typescript
// Package imports
import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  spyOn,
  mock
} from 'bun:test';

// Project imports
import { createHelloCommand } from '../src/commands/hello';

describe('[Unit] - createHelloCommand', () => {
  // Test cases go here
});
```

## Utility Types

### 1. **Pure Functions**

Stateless functions that transform inputs to outputs without side effects.

### 2. **CLI Commands**

Commander.js command factory functions that return `Command` instances.

### 3. **Type Guards**

Functions that narrow TypeScript types at runtime.

### 4. **Helper Utilities**

Utility functions for string manipulation, validation, formatting, etc.

## Testing Patterns by Utility Type

### Pure Functions

```typescript
describe('[Unit] - formatMigrationName', () => {
  it('should format migration name with timestamp', () => {
    const result = formatMigrationName('add_users_table');
    expect(result).toMatch(/^\d{14}_add_users_table$/);
  });

  it('should handle empty string', () => {
    const result = formatMigrationName('');
    expect(result).toMatch(/^\d{14}_$/);
  });

  it('should sanitize special characters', () => {
    const result = formatMigrationName('add users/table');
    expect(result).toMatch(/^\d{14}_add_users_table$/);
  });
});
```

### CLI Commands

```typescript
describe('[Unit] - createHelloCommand', () => {
  it('should create a command with correct name', () => {
    const cmd = createHelloCommand();
    expect(cmd.name()).toBe('hello');
  });

  it('should have correct description', () => {
    const cmd = createHelloCommand();
    expect(cmd.description()).toBe('Say hello to someone');
  });

  it('should accept optional name argument', () => {
    const cmd = createHelloCommand();
    const args = cmd.registeredArguments;
    expect(args).toHaveLength(1);
    expect(args[0]?.name()).toBe('name');
  });

  it('should have shout option', () => {
    const cmd = createHelloCommand();
    const option = cmd.options.find((opt) => opt.long === '--shout');
    expect(option).toBeDefined();
  });
});
```

### Type Guards

```typescript
describe('[Unit] - isMigrationFile', () => {
  it('should return true for valid migration files', () => {
    expect(isMigrationFile('20240101120000_create_users.ts')).toBe(true);
    expect(isMigrationFile('20240101120000_add_index.ts')).toBe(true);
  });

  it('should return false for invalid migration files', () => {
    expect(isMigrationFile('create_users.ts')).toBe(false);
    expect(isMigrationFile('20240101_short.ts')).toBe(false);
    expect(isMigrationFile('readme.md')).toBe(false);
  });

  it('should narrow type correctly', () => {
    const filename: string = '20240101120000_test.ts';
    if (isMigrationFile(filename)) {
      // TypeScript should know this is a valid migration filename
      expect(filename).toMatch(/^\d{14}_/);
    }
  });
});
```

### Helper Utilities

```typescript
describe('[Unit] - parseConnectionString', () => {
  it('should parse valid connection string', () => {
    const result = parseConnectionString(
      'postgres://user:pass@localhost:5432/db'
    );
    expect(result).toEqual({
      provider: 'postgres',
      user: 'user',
      password: 'pass',
      host: 'localhost',
      port: 5432,
      database: 'db'
    });
  });

  it('should handle missing password', () => {
    const result = parseConnectionString('postgres://user@localhost:5432/db');
    expect(result.password).toBeUndefined();
  });

  it('should throw on invalid format', () => {
    expect(() => parseConnectionString('invalid')).toThrow();
  });
});
```

## Core Test Categories

### 1. **Basic Functionality**

- Core behavior and return values
- Input/output validation
- Expected behavior under normal conditions

### 2. **Command Structure** (CLI Commands)

- Command name and description
- Arguments and options
- Default values

### 3. **Edge Cases**

- Null/undefined inputs
- Empty collections
- Boundary values
- Error scenarios

### 4. **Type Safety** (Type Guards)

- Correct type narrowing
- False positives/negatives
- All valid type values

## Testing Patterns

### Test Console Output

```typescript
describe('[Unit] - hello command action', () => {
  let consoleSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should output greeting', async () => {
    const cmd = createHelloCommand();
    await cmd.parseAsync(['node', 'test', 'World']);

    expect(consoleSpy).toHaveBeenCalledWith('Hello, World!');
  });

  it('should shout when option is provided', async () => {
    const cmd = createHelloCommand();
    await cmd.parseAsync(['node', 'test', 'World', '--shout']);

    expect(consoleSpy).toHaveBeenCalledWith('HELLO, WORLD!');
  });
});
```

### Mock Dependencies

Use `spyOn` to mock imported module functions. This is the preferred approach
as it doesn't require external dependencies like memfs.

```typescript
import { spyOn, mock } from 'bun:test';
import * as fsConfigModule from '../src/fs/config';

describe('[Unit] - readConfig', () => {
  let readConfigSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    // Mock specific functions from imported modules
    readConfigSpy = spyOn(fsConfigModule, 'readConfig');
  });

  afterEach(() => {
    readConfigSpy.mockRestore();
  });

  it('should read and parse config file', async () => {
    const mockConfig = { database: 'test' };
    readConfigSpy.mockReturnValue(mockConfig);

    const result = readConfig('./config.json');
    expect(result).toEqual(mockConfig);
  });

  it('should throw when config file not found', () => {
    readConfigSpy.mockImplementation(() => {
      throw new Error('Config not found');
    });

    expect(() => readConfig('./config.json')).toThrow('Config not found');
  });
});
```

### Mock Entire Modules (when needed)

For low-level Node.js modules, use `mock.module`:

```typescript
import { mock } from 'bun:test';

describe('[Unit] - fileOperations', () => {
  beforeEach(() => {
    mock.module('fs', () => ({
      existsSync: () => true,
      readFileSync: () => '{"key": "value"}'
    }));
  });

  afterEach(() => {
    mock.restore();
  });

  it('should check if file exists', () => {
    // Your test here
  });
});
```

### Test Error Handling

```typescript
describe('[Unit] - validateConfig', () => {
  it('should throw on missing required fields', () => {
    expect(() => validateConfig({})).toThrow(
      'Missing required field: database'
    );
  });

  it('should throw on invalid port', () => {
    expect(() => validateConfig({ database: 'test', port: -1 })).toThrow(
      'Invalid port'
    );
  });
});
```

## Requirements Checklist

- [ ] Use `[Unit] - functionName` describe format
- [ ] File name ends with `.test.ts`
- [ ] Mirror source structure in tests directory
- [ ] Import from project using relative paths (no `.js` extension needed with Bun)
  - [ ] Test utility in isolation
- [ ] Test command structure for CLI commands
- [ ] Test edge cases and error scenarios
- [ ] Use spies for console output and module functions
- [ ] Use `spyOn` for mocking imported module functions (preferred)
- [ ] Use `mock.module` for low-level Node.js module mocking (when needed)
- [ ] **NEVER bypass the type system or use `any` type unless absolutely necessary**
- [ ] **ALWAYS run tests after writing them: `bun test:run`**
- [ ] **ALWAYS run linting after writing tests: `bun lint`**
- [ ] **ALWAYS run type checks after writing tests: `bun typecheck`**
- [ ] **Fix all errors from tests, linting, and type checking before considering the task complete**
- [ ] **Coverage threshold: Aim for 80% coverage on functions and lines**

## Test Organization

### Recommended Describe Blocks:

#### For Pure Functions:

1. **Basic Functionality** - Core behavior
2. **Edge Cases** - Null values, empty inputs, boundaries
3. **Error Handling** - Invalid inputs, exceptions

#### For CLI Commands:

1. **Command Structure** - Name, description, options
2. **Arguments** - Required and optional arguments
3. **Options** - Flags and value options
4. **Action Behavior** - Command execution

#### For Type Guards:

1. **Basic Functionality** - True/false cases
2. **Type Safety** - Type narrowing verification
3. **Edge Cases** - Complex objects, boundary values

## Don't Test

- Commander.js internal behavior
- Node.js built-in functions
- Implementation details of external dependencies
- Private functions (test through public API)

## Performance Guidelines

- Clean up all spies and mocks in `afterEach`
- Use `mock.restore()` for cleanup
- Keep tests fast and focused
- Avoid unnecessary async operations

## Common Patterns

### Mock Callbacks

```typescript
let mockCallback: ReturnType<typeof mock>;

beforeEach(() => {
  mockCallback = mock();
});
```

### Test Async Functions

```typescript
it('should handle async operations', async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});

it('should handle promise rejection', async () => {
  await expect(failingAsyncFunction()).rejects.toThrow('Expected error');
});
```

### Parameterized Tests

```typescript
describe('[Unit] - isValidProvider', () => {
  const validProviders = ['postgres', 'mysql', 'sqlite'];
  const invalidProviders = ['mongodb', 'redis', ''];

  it.each(validProviders)('should return true for %s', (provider) => {
    expect(isValidProvider(provider)).toBe(true);
  });

  it.each(invalidProviders)('should return false for %s', (provider) => {
    expect(isValidProvider(provider)).toBe(false);
  });
});
```
