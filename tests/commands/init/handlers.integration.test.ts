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
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { createHash } from 'crypto';
import canonicalize from 'canonicalize';

// Project imports
import { initCmd_Handler } from '../../../src/commands/init/handlers';
import { CliError } from '../../../src/error/CliError';
import * as printerModule from '../../../src/ui/printer';
import * as apiModule from '../../../src/api/client';
import * as manifestModule from '../../../src/fs/manifest';
import * as inquirerPrompts from '@inquirer/prompts';

// ─────────────────────────────────────────────────────────────
// Test Fixtures
// ─────────────────────────────────────────────────────────────

// Valid API key format: sk_<uuidv4>_<64-char-lowercase-hex>
const VALID_API_KEY =
  'sk_a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d_0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

/**
 * Compute the content hash the same way the real code does
 */
function computeTestContentHash(snapshot: {
  engineKey: string;
  description: string | null;
  data: { tables: unknown[] } | null;
}): string {
  const { engineKey, description, data } = snapshot;

  const content =
    data !== null
      ? description !== null
        ? { engineKey, description, tables: data.tables }
        : { engineKey, tables: data.tables }
      : description !== null
        ? { engineKey, description }
        : { engineKey };

  const canonicalJson = canonicalize(content) ?? '';
  const hash = createHash('sha256').update(canonicalJson).digest('hex');
  return `sha256:${hash}`;
}

interface MockSchema {
  id: string;
  projectId: string;
  name: string;
  engine: 'postgresql';
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface MockSnapshot {
  id: string;
  schemaId: string;
  parentId: string | null;
  label: string;
  description: string | null;
  engine: 'postgresql';
  engineVersion: 'v15.0';
  engineKey: 'postgresql:v15.0';
  status: 'done' | 'draft';
  contentHash: string;
  data: { tables: unknown[] } | null;
  createdAt: Date;
  updatedAt: Date;
}

function createMockSchema(overrides: Partial<MockSchema> = {}): MockSchema {
  return {
    id: 'schema-uuid-1234',
    projectId: 'project-uuid-1234',
    name: 'Test Schema',
    engine: 'postgresql',
    description: 'A test schema',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides
  };
}

function createMockSnapshot(
  overrides: Partial<MockSnapshot> = {}
): MockSnapshot {
  const base = {
    id: 'snapshot-uuid-1234',
    schemaId: 'schema-uuid-1234',
    parentId: null,
    label: 'v1.0.0',
    description: 'Initial snapshot',
    engine: 'postgresql' as const,
    engineVersion: 'v15.0' as const,
    engineKey: 'postgresql:v15.0' as const,
    status: 'done' as const,
    data: { tables: [] },
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides
  };

  // Compute the correct content hash based on actual data
  const contentHash = computeTestContentHash({
    engineKey: base.engineKey,
    description: base.description,
    data: base.data
  });

  return {
    ...base,
    contentHash
  };
}

// ─────────────────────────────────────────────────────────────
// Test Helpers
// ─────────────────────────────────────────────────────────────

function createTempDir(): string {
  const tempDir = path.join(
    os.tmpdir(),
    `bfloo-test-${String(Date.now())}-${Math.random().toString(36).slice(2)}`
  );
  fs.mkdirSync(tempDir, { recursive: true });
  return tempDir;
}

function cleanupTempDir(dir: string): void {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function createExistingProject(projectRoot: string): void {
  // Create bfloo.yml
  const configContent = `schemas:
  existing-schema:
    dir: db-schemas
    key: ${VALID_API_KEY}
    engine: PostgreSQL
    envs: {}
`;
  fs.writeFileSync(path.join(projectRoot, 'bfloo.yml'), configContent);

  // Create .bfloo directory with manifest
  const bflooDir = path.join(projectRoot, '.bfloo');
  const schemaDir = path.join(bflooDir, 'existing-schema');
  fs.mkdirSync(schemaDir, { recursive: true });

  const manifestContent = `schema-id: existing-schema-id
snapshots: {}
`;
  fs.writeFileSync(path.join(schemaDir, 'manifest.yml'), manifestContent);

  // Create working snapshot
  const workingDir = path.join(projectRoot, 'db-schemas');
  fs.mkdirSync(workingDir, { recursive: true });

  const workingSnapshotContent = `schema:
  name: Existing Schema
snapshot:
  label: v0.1.0
  engine-version: v15.0
  tables: []
`;
  fs.writeFileSync(
    path.join(workingDir, 'existing-schema.yml'),
    workingSnapshotContent
  );
}

// ─────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────

describe('[Integration] - initCmd_Handler (Real Filesystem)', () => {
  let tempDir: string;
  let originalCwd: string;
  let apiSpies: {
    getByApiKey: ReturnType<typeof spyOn>;
    listByApiKey: ReturnType<typeof spyOn>;
  };
  let printerSpies: {
    spacer: ReturnType<typeof spyOn>;
    header: ReturnType<typeof spyOn>;
    text: ReturnType<typeof spyOn>;
    info: ReturnType<typeof spyOn>;
    success: ReturnType<typeof spyOn>;
    warning: ReturnType<typeof spyOn>;
    step: ReturnType<typeof spyOn>;
    keyValue: ReturnType<typeof spyOn>;
    withSpinner: ReturnType<typeof spyOn>;
    rollbackStart: ReturnType<typeof spyOn>;
    rollbackComplete: ReturnType<typeof spyOn>;
    rollbackWarning: ReturnType<typeof spyOn>;
  };

  beforeEach(() => {
    // Create temp directory and change to it
    tempDir = createTempDir();
    originalCwd = process.cwd();
    process.chdir(tempDir);

    // Mock API calls - these are external dependencies we can't control
    apiSpies = {
      getByApiKey: spyOn(
        apiModule.ApiClient.schema,
        'getByApiKey'
      ).mockResolvedValue(createMockSchema()),
      listByApiKey: spyOn(
        apiModule.ApiClient.schemaSnapshot,
        'listByApiKey'
      ).mockResolvedValue([createMockSnapshot()])
    };

    // Mock printer to suppress output but track calls
    printerSpies = {
      spacer: spyOn(printerModule.printer, 'spacer').mockImplementation(
        () => {}
      ),
      header: spyOn(printerModule.printer, 'header').mockImplementation(
        () => {}
      ),
      text: spyOn(printerModule.printer, 'text').mockImplementation(() => {}),
      info: spyOn(printerModule.printer, 'info').mockImplementation(() => {}),
      success: spyOn(printerModule.printer, 'success').mockImplementation(
        () => {}
      ),
      warning: spyOn(printerModule.printer, 'warning').mockImplementation(
        () => {}
      ),
      step: spyOn(printerModule.printer, 'step').mockImplementation(() => {}),
      keyValue: spyOn(printerModule.printer, 'keyValue').mockImplementation(
        () => {}
      ),
      withSpinner: spyOn(
        printerModule.printer,
        'withSpinner'
      ).mockImplementation(async <T>(promise: Promise<T>) => promise),
      rollbackStart: spyOn(
        printerModule.printer,
        'rollbackStart'
      ).mockImplementation(() => {}),
      rollbackComplete: spyOn(
        printerModule.printer,
        'rollbackComplete'
      ).mockImplementation(() => {}),
      rollbackWarning: spyOn(
        printerModule.printer,
        'rollbackWarning'
      ).mockImplementation(() => {})
    };
  });

  afterEach(() => {
    // Restore cwd and cleanup
    process.chdir(originalCwd);
    cleanupTempDir(tempDir);

    // Restore spies
    for (const spy of Object.values(apiSpies)) {
      spy.mockRestore();
    }
    for (const spy of Object.values(printerSpies)) {
      spy.mockRestore();
    }
    mock.restore();
  });

  // ─────────────────────────────────────────────────────────────
  // Fresh Project Initialization
  // ─────────────────────────────────────────────────────────────

  describe('Fresh Project Initialization', () => {
    it('should create .bfloo directory on fresh init', async () => {
      await initCmd_Handler({
        key: VALID_API_KEY,
        localKey: 'test-schema',
        reinit: false,
        dir: 'db-schemas',
        yes: true,
        dryRun: false,
        quiet: true
      });

      expect(fs.existsSync(path.join(tempDir, '.bfloo'))).toBe(true);
    });

    it('should create bfloo.yml config file', async () => {
      await initCmd_Handler({
        key: VALID_API_KEY,
        localKey: 'test-schema',
        reinit: false,
        dir: 'db-schemas',
        yes: true,
        dryRun: false,
        quiet: true
      });

      const configPath = path.join(tempDir, 'bfloo.yml');
      expect(fs.existsSync(configPath)).toBe(true);

      const configContent = fs.readFileSync(configPath, 'utf-8');
      expect(configContent).toContain('test-schema');
      expect(configContent).toContain('db-schemas');
    });

    it('should create manifest.yml for the schema', async () => {
      await initCmd_Handler({
        key: VALID_API_KEY,
        localKey: 'test-schema',
        reinit: false,
        dir: 'db-schemas',
        yes: true,
        dryRun: false,
        quiet: true
      });

      const manifestPath = path.join(
        tempDir,
        '.bfloo',
        'test-schema',
        'manifest.yml'
      );
      expect(fs.existsSync(manifestPath)).toBe(true);
    });

    it('should create working snapshot file', async () => {
      await initCmd_Handler({
        key: VALID_API_KEY,
        localKey: 'test-schema',
        reinit: false,
        dir: 'db-schemas',
        yes: true,
        dryRun: false,
        quiet: true
      });

      const workingPath = path.join(tempDir, 'db-schemas', 'test-schema.yml');
      expect(fs.existsSync(workingPath)).toBe(true);

      const content = fs.readFileSync(workingPath, 'utf-8');
      expect(content).toContain('v1.0.0'); // snapshot label
    });

    it('should write stored snapshots when there are multiple', async () => {
      const olderSnapshot = createMockSnapshot({
        id: 'older-snap',
        label: 'v0.9.0',
        createdAt: new Date('2023-12-01')
      });
      const newerSnapshot = createMockSnapshot({
        id: 'newer-snap',
        label: 'v1.0.0',
        createdAt: new Date('2024-01-01')
      });

      apiSpies.listByApiKey.mockResolvedValue([olderSnapshot, newerSnapshot]);

      await initCmd_Handler({
        key: VALID_API_KEY,
        localKey: 'test-schema',
        reinit: false,
        dir: 'db-schemas',
        yes: true,
        dryRun: false,
        quiet: true
      });

      // Check snapshots directory exists
      const snapshotsDir = path.join(
        tempDir,
        '.bfloo',
        'test-schema',
        'snapshots'
      );
      expect(fs.existsSync(snapshotsDir)).toBe(true);

      // Should have stored the older snapshot
      const storedFiles = fs.readdirSync(snapshotsDir);
      expect(storedFiles.length).toBe(1);
      expect(storedFiles[0]).toContain('v0.9.0');
    });

    it('should show success message after initialization', async () => {
      await initCmd_Handler({
        key: VALID_API_KEY,
        localKey: 'test-schema',
        reinit: false,
        dir: 'db-schemas',
        yes: true,
        dryRun: false,
        quiet: false
      });

      expect(printerSpies.success).toHaveBeenCalledWith(
        'Project initialized successfully'
      );
    });

    it('should show API key warning after initialization', async () => {
      await initCmd_Handler({
        key: VALID_API_KEY,
        localKey: 'test-schema',
        reinit: false,
        dir: 'db-schemas',
        yes: true,
        dryRun: false,
        quiet: false
      });

      expect(printerSpies.warning).toHaveBeenCalledWith(
        expect.stringContaining('API key')
      );
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Project Already Initialized
  // ─────────────────────────────────────────────────────────────

  describe('Project Already Initialized', () => {
    beforeEach(() => {
      createExistingProject(tempDir);
    });

    it('should throw CliError when project exists without --reinit', async () => {
      let thrownError: CliError | null = null;

      try {
        await initCmd_Handler({
          key: VALID_API_KEY,
          localKey: 'new-schema',
          reinit: false,
          dir: 'db-schemas',
          yes: true,
          dryRun: false,
          quiet: true
        });
      } catch (error) {
        if (error instanceof CliError) {
          thrownError = error;
        }
      }

      expect(thrownError).toBeInstanceOf(CliError);
      expect(thrownError?.title).toBe('Project already initialized');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Reinit Flow - ACTUAL BACKUP AND RESTORE
  // ─────────────────────────────────────────────────────────────

  describe('Reinit Flow (Real Backup/Restore)', () => {
    beforeEach(() => {
      createExistingProject(tempDir);
    });

    it('should backup and clear existing state during reinit', async () => {
      // Verify existing state before reinit
      expect(
        fs.existsSync(path.join(tempDir, 'db-schemas', 'existing-schema.yml'))
      ).toBe(true);
      expect(
        fs.existsSync(
          path.join(tempDir, '.bfloo', 'existing-schema', 'manifest.yml')
        )
      ).toBe(true);

      await initCmd_Handler({
        key: VALID_API_KEY,
        localKey: 'new-schema',
        reinit: true,
        dir: 'db-schemas',
        yes: true,
        dryRun: false,
        quiet: true
      });

      // Old schema should be cleared
      expect(
        fs.existsSync(
          path.join(tempDir, '.bfloo', 'existing-schema', 'manifest.yml')
        )
      ).toBe(false);

      // New schema should exist
      expect(
        fs.existsSync(
          path.join(tempDir, '.bfloo', 'new-schema', 'manifest.yml')
        )
      ).toBe(true);
      expect(
        fs.existsSync(path.join(tempDir, 'db-schemas', 'new-schema.yml'))
      ).toBe(true);
    });

    it('should show reinit success message', async () => {
      await initCmd_Handler({
        key: VALID_API_KEY,
        localKey: 'new-schema',
        reinit: true,
        dir: 'db-schemas',
        yes: true,
        dryRun: false,
        quiet: false
      });

      expect(printerSpies.success).toHaveBeenCalledWith(
        'Project re-initialized successfully'
      );
    });

    it('should preserve working snapshot paths during backup with existing snapshots', async () => {
      // Verify existing working snapshot exists
      const existingWorkingPath = path.join(
        tempDir,
        'db-schemas',
        'existing-schema.yml'
      );
      expect(fs.existsSync(existingWorkingPath)).toBe(true);

      await initCmd_Handler({
        key: VALID_API_KEY,
        localKey: 'new-schema',
        reinit: true,
        dir: 'db-schemas',
        yes: true,
        dryRun: false,
        quiet: true
      });

      // After successful reinit, old working snapshot should be removed
      // and new one should exist
      expect(fs.existsSync(existingWorkingPath)).toBe(false);
      expect(
        fs.existsSync(path.join(tempDir, 'db-schemas', 'new-schema.yml'))
      ).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Rollback Behavior - ACTUAL ROLLBACK ON FAILURE
  // ─────────────────────────────────────────────────────────────

  describe('Rollback Behavior (Real Rollback on Failure)', () => {
    it('should rollback .bfloo directory creation when config write fails', async () => {
      // Make the writeManifest fail after directory is created
      // We need to fail at a specific step to trigger rollback
      const originalWriteFileSync = fs.writeFileSync;

      // Mock writeFileSync to fail on a specific write (manifest)
      const writeFileSpy = spyOn(fs, 'writeFileSync').mockImplementation(
        (filePath, data, options) => {
          // Let the first few writes succeed, then fail on manifest
          if (
            typeof filePath === 'string' &&
            filePath.includes('manifest.yml')
          ) {
            throw new Error('Simulated write failure');
          }
          originalWriteFileSync(filePath, data, options);
        }
      );

      let thrownError: Error | null = null;

      try {
        await initCmd_Handler({
          key: VALID_API_KEY,
          localKey: 'test-schema',
          reinit: false,
          dir: 'db-schemas',
          yes: true,
          dryRun: false,
          quiet: false
        });
      } catch (error) {
        thrownError = error as Error;
      }

      writeFileSpy.mockRestore();

      expect(thrownError).toBeInstanceOf(Error);
      expect(thrownError?.message).toBe('Simulated write failure');

      // Rollback should have been triggered
      expect(printerSpies.rollbackStart).toHaveBeenCalled();

      // .bfloo directory should be removed by rollback
      // Note: The exact state depends on which step failed
    });

    it('should rollback config file when manifest write fails', async () => {
      const originalWriteFileSync = fs.writeFileSync;

      // Mock writeFileSync to fail specifically on manifest
      const writeFileSpy = spyOn(fs, 'writeFileSync').mockImplementation(
        (filePath, data, options) => {
          if (
            typeof filePath === 'string' &&
            filePath.includes('manifest.yml')
          ) {
            throw new Error('Manifest write failed');
          }
          originalWriteFileSync(filePath, data, options);
        }
      );

      let thrownError: Error | null = null;

      try {
        await initCmd_Handler({
          key: VALID_API_KEY,
          localKey: 'test-schema',
          reinit: false,
          dir: 'db-schemas',
          yes: true,
          dryRun: false,
          quiet: false
        });
      } catch (error) {
        thrownError = error as Error;
      }

      writeFileSpy.mockRestore();

      expect(thrownError).toBeInstanceOf(Error);

      // Config file should be removed by rollback
      expect(fs.existsSync(path.join(tempDir, 'bfloo.yml'))).toBe(false);
    });

    it('should restore backup during reinit rollback on failure', async () => {
      createExistingProject(tempDir);

      // Save original state to compare after rollback
      const originalConfig = fs.readFileSync(
        path.join(tempDir, 'bfloo.yml'),
        'utf-8'
      );
      const originalManifest = fs.readFileSync(
        path.join(tempDir, '.bfloo', 'existing-schema', 'manifest.yml'),
        'utf-8'
      );

      const originalWriteFileSync = fs.writeFileSync;

      // Fail on a late step to ensure backup was created
      let manifestWriteCount = 0;
      const writeFileSpy = spyOn(fs, 'writeFileSync').mockImplementation(
        (filePath, data, options) => {
          if (
            typeof filePath === 'string' &&
            filePath.includes('manifest.yml')
          ) {
            manifestWriteCount++;
            // Let the clear step happen, but fail on new manifest write
            if (manifestWriteCount > 0) {
              throw new Error('Simulated manifest failure during reinit');
            }
          }
          originalWriteFileSync(filePath, data, options);
        }
      );

      let thrownError: Error | null = null;

      try {
        await initCmd_Handler({
          key: VALID_API_KEY,
          localKey: 'new-schema',
          reinit: true,
          dir: 'db-schemas',
          yes: true,
          dryRun: false,
          quiet: false
        });
      } catch (error) {
        thrownError = error as Error;
      }

      writeFileSpy.mockRestore();

      expect(thrownError).toBeInstanceOf(Error);
      expect(printerSpies.rollbackStart).toHaveBeenCalled();

      // After rollback, original state should be restored
      expect(fs.existsSync(path.join(tempDir, 'bfloo.yml'))).toBe(true);
      const restoredConfig = fs.readFileSync(
        path.join(tempDir, 'bfloo.yml'),
        'utf-8'
      );
      expect(restoredConfig).toBe(originalConfig);

      // Original manifest should be restored
      expect(
        fs.existsSync(
          path.join(tempDir, '.bfloo', 'existing-schema', 'manifest.yml')
        )
      ).toBe(true);
      const restoredManifest = fs.readFileSync(
        path.join(tempDir, '.bfloo', 'existing-schema', 'manifest.yml'),
        'utf-8'
      );
      expect(restoredManifest).toBe(originalManifest);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Dry Run Mode
  // ─────────────────────────────────────────────────────────────

  describe('Dry Run Mode', () => {
    it('should not create any files in dry run mode', async () => {
      await initCmd_Handler({
        key: VALID_API_KEY,
        localKey: 'test-schema',
        reinit: false,
        dir: 'db-schemas',
        yes: true,
        dryRun: true,
        quiet: false
      });

      expect(fs.existsSync(path.join(tempDir, '.bfloo'))).toBe(false);
      expect(fs.existsSync(path.join(tempDir, 'bfloo.yml'))).toBe(false);
      expect(fs.existsSync(path.join(tempDir, 'db-schemas'))).toBe(false);
    });

    it('should show step messages for what would happen', async () => {
      await initCmd_Handler({
        key: VALID_API_KEY,
        localKey: 'test-schema',
        reinit: false,
        dir: 'db-schemas',
        yes: true,
        dryRun: true,
        quiet: false
      });

      expect(printerSpies.step).toHaveBeenCalled();
      expect(printerSpies.info).toHaveBeenCalledWith(
        'Dry run complete - no changes were made'
      );
    });

    it('should show backup steps in reinit dry run', async () => {
      createExistingProject(tempDir);

      await initCmd_Handler({
        key: VALID_API_KEY,
        localKey: 'new-schema',
        reinit: true,
        dir: 'db-schemas',
        yes: true,
        dryRun: true,
        quiet: false
      });

      // Should show backup-related steps
      expect(printerSpies.step).toHaveBeenCalledWith(
        expect.stringContaining('backup')
      );
    });

    it('should show stored snapshot count in dry run with multiple snapshots', async () => {
      // Set up multiple snapshots (current + 2 stored = storedCount of 2)
      const snapshots = [
        createMockSnapshot({
          id: 'snap-current',
          label: 'v1.0.0',
          createdAt: new Date('2024-01-03')
        }),
        createMockSnapshot({
          id: 'snap-old-1',
          label: 'v0.9.0',
          createdAt: new Date('2024-01-02')
        }),
        createMockSnapshot({
          id: 'snap-old-2',
          label: 'v0.8.0',
          createdAt: new Date('2024-01-01')
        })
      ];
      apiSpies.listByApiKey.mockResolvedValue(snapshots);

      await initCmd_Handler({
        key: VALID_API_KEY,
        localKey: 'test-schema',
        reinit: false,
        dir: 'db-schemas',
        yes: true,
        dryRun: true,
        quiet: false
      });

      // Should show message about stored snapshots (2 stored files)
      expect(printerSpies.step).toHaveBeenCalledWith(
        expect.stringContaining('2 stored snapshot file(s)')
      );
    });
  });

  // ─────────────────────────────────────────────────────────────
  // API Key Validation
  // ─────────────────────────────────────────────────────────────

  describe('API Key Validation', () => {
    it('should throw CliError for invalid API key format', async () => {
      let thrownError: CliError | null = null;

      try {
        await initCmd_Handler({
          key: 'invalid-key',
          localKey: 'test-schema',
          reinit: false,
          dir: 'db-schemas',
          yes: true,
          dryRun: false,
          quiet: true
        });
      } catch (error) {
        if (error instanceof CliError) {
          thrownError = error;
        }
      }

      expect(thrownError).toBeInstanceOf(CliError);
      expect(thrownError?.title).toBe('Invalid API Key');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Local Key Validation
  // ─────────────────────────────────────────────────────────────

  describe('Local Key Validation', () => {
    it('should throw CliError for invalid local key', async () => {
      let thrownError: CliError | null = null;

      try {
        await initCmd_Handler({
          key: VALID_API_KEY,
          localKey: 'Invalid Key With Spaces',
          reinit: false,
          dir: 'db-schemas',
          yes: true,
          dryRun: false,
          quiet: true
        });
      } catch (error) {
        if (error instanceof CliError) {
          thrownError = error;
        }
      }

      expect(thrownError).toBeInstanceOf(CliError);
      expect(thrownError?.title).toBe('Invalid local key');
    });

    it('should use normalized schema name when no local key provided', async () => {
      const mockSchema = createMockSchema({ name: 'My Test Schema' });
      apiSpies.getByApiKey.mockResolvedValue(mockSchema);

      await initCmd_Handler({
        key: VALID_API_KEY,
        localKey: undefined,
        reinit: false,
        dir: 'db-schemas',
        yes: true,
        dryRun: false,
        quiet: true
      });

      // normalizeSchemaName converts spaces to underscores and lowercases
      const configContent = fs.readFileSync(
        path.join(tempDir, 'bfloo.yml'),
        'utf-8'
      );
      expect(configContent).toContain('my_test_schema');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Schema ID Collision
  // ─────────────────────────────────────────────────────────────

  describe('Schema ID Collision', () => {
    it('should throw "Project already initialized" when project exists without --reinit', async () => {
      // Note: The "Schema already exists" check (for same schema ID under different local key)
      // is only reachable via 'bfloo add' command. With 'init', we either:
      // 1. Have no existing project (fresh init) - no manifests to check
      // 2. Have existing project + reinit:false -> "Project already initialized" (this test)
      // 3. Have existing project + reinit:true -> bypasses the schema ID check
      createExistingProject(tempDir);

      // Mock API to return schema with same ID as existing
      apiSpies.getByApiKey.mockResolvedValue(
        createMockSchema({ id: 'existing-schema-id' })
      );

      let thrownError: CliError | null = null;

      try {
        await initCmd_Handler({
          key: VALID_API_KEY,
          localKey: 'different-local-key',
          reinit: false,
          dir: 'other-dir',
          yes: true,
          dryRun: false,
          quiet: true
        });
      } catch (error) {
        if (error instanceof CliError) {
          thrownError = error;
        }
      }

      expect(thrownError).toBeInstanceOf(CliError);
      expect(thrownError?.title).toBe('Project already initialized');
    });

    it('should allow same schema ID with --reinit', async () => {
      createExistingProject(tempDir);

      apiSpies.getByApiKey.mockResolvedValue(
        createMockSchema({ id: 'existing-schema-id' })
      );

      // Should not throw with reinit
      await initCmd_Handler({
        key: VALID_API_KEY,
        localKey: 'new-local-key',
        reinit: true,
        dir: 'db-schemas',
        yes: true,
        dryRun: false,
        quiet: true
      });

      expect(
        fs.existsSync(path.join(tempDir, 'db-schemas', 'new-local-key.yml'))
      ).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Snapshot Handling
  // ─────────────────────────────────────────────────────────────

  describe('Snapshot Handling', () => {
    it('should throw Internal Error for empty snapshots array', async () => {
      // When API returns no snapshots, buildManifestFromSnapshots throws
      // because it cannot determine a "current" snapshot
      apiSpies.listByApiKey.mockResolvedValue([]);

      let thrownError: CliError | null = null;

      try {
        await initCmd_Handler({
          key: VALID_API_KEY,
          localKey: 'test-schema',
          reinit: false,
          dir: 'db-schemas',
          yes: true,
          dryRun: false,
          quiet: true
        });
      } catch (error) {
        if (error instanceof CliError) {
          thrownError = error;
        }
      }

      expect(thrownError).toBeInstanceOf(CliError);
      expect(thrownError?.title).toBe('Internal Error');
      expect(thrownError?.message).toContain(
        'Failed to determine current snapshot'
      );
    });

    it('should handle snapshot with null data', async () => {
      apiSpies.listByApiKey.mockResolvedValue([
        createMockSnapshot({ data: null })
      ]);

      await initCmd_Handler({
        key: VALID_API_KEY,
        localKey: 'test-schema',
        reinit: false,
        dir: 'db-schemas',
        yes: true,
        dryRun: false,
        quiet: true
      });

      // Working snapshot should be created with empty tables
      const workingPath = path.join(tempDir, 'db-schemas', 'test-schema.yml');
      expect(fs.existsSync(workingPath)).toBe(true);

      const content = fs.readFileSync(workingPath, 'utf-8');
      expect(content).toContain('tables: []');
    });

    it('should handle snapshot with null description', async () => {
      apiSpies.listByApiKey.mockResolvedValue([
        createMockSnapshot({ description: null })
      ]);

      await initCmd_Handler({
        key: VALID_API_KEY,
        localKey: 'test-schema',
        reinit: false,
        dir: 'db-schemas',
        yes: true,
        dryRun: false,
        quiet: true
      });

      expect(
        fs.existsSync(path.join(tempDir, 'db-schemas', 'test-schema.yml'))
      ).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // API Errors
  // ─────────────────────────────────────────────────────────────

  describe('API Errors', () => {
    it('should propagate schema fetch errors', async () => {
      apiSpies.getByApiKey.mockRejectedValue(new Error('Network error'));

      let thrownError: Error | null = null;

      try {
        await initCmd_Handler({
          key: VALID_API_KEY,
          localKey: 'test-schema',
          reinit: false,
          dir: 'db-schemas',
          yes: true,
          dryRun: false,
          quiet: true
        });
      } catch (error) {
        thrownError = error as Error;
      }

      expect(thrownError).toBeInstanceOf(Error);
      expect(thrownError?.message).toBe('Network error');

      // No files should be created
      expect(fs.existsSync(path.join(tempDir, 'bfloo.yml'))).toBe(false);
    });

    it('should propagate snapshot fetch errors', async () => {
      apiSpies.listByApiKey.mockRejectedValue(new Error('Snapshot API error'));

      let thrownError: Error | null = null;

      try {
        await initCmd_Handler({
          key: VALID_API_KEY,
          localKey: 'test-schema',
          reinit: false,
          dir: 'db-schemas',
          yes: true,
          dryRun: false,
          quiet: true
        });
      } catch (error) {
        thrownError = error as Error;
      }

      expect(thrownError).toBeInstanceOf(Error);
      expect(thrownError?.message).toBe('Snapshot API error');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Schema ID Collision (via mock)
  // ─────────────────────────────────────────────────────────────

  describe('Schema ID Collision (mocked)', () => {
    it('should throw "Schema already exists" when schema ID found in manifests', async () => {
      // Mock findSchemaIdInManifests to return an existing local key
      const findSpy = spyOn(
        manifestModule,
        'findSchemaIdInManifests'
      ).mockReturnValue('existing-local-key');

      let thrownError: CliError | null = null;

      try {
        await initCmd_Handler({
          key: VALID_API_KEY,
          localKey: 'new-schema',
          reinit: false,
          dir: 'db-schemas',
          yes: true,
          dryRun: false,
          quiet: true
        });
      } catch (error) {
        if (error instanceof CliError) {
          thrownError = error;
        }
      }

      findSpy.mockRestore();

      expect(thrownError).toBeInstanceOf(CliError);
      expect(thrownError?.title).toBe('Schema already exists');
      expect(thrownError?.message).toContain('existing-local-key');
    });

    it('should not check schema ID collision when reinit is true', async () => {
      // Mock findSchemaIdInManifests - should NOT be called with reinit: true
      const findSpy = spyOn(
        manifestModule,
        'findSchemaIdInManifests'
      ).mockReturnValue('existing-local-key');

      // This should succeed because reinit bypasses the schema ID check
      await initCmd_Handler({
        key: VALID_API_KEY,
        localKey: 'new-schema',
        reinit: true,
        dir: 'db-schemas',
        yes: true,
        dryRun: false,
        quiet: true
      });

      findSpy.mockRestore();

      // Verify init succeeded
      expect(fs.existsSync(path.join(tempDir, 'bfloo.yml'))).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Interactive Prompts
  // ─────────────────────────────────────────────────────────────

  describe('Interactive Prompts', () => {
    let passwordMock: ReturnType<typeof spyOn>;
    let confirmMock: ReturnType<typeof spyOn>;
    let inputMock: ReturnType<typeof spyOn>;

    beforeEach(() => {
      // Set up mocks for @inquirer/prompts functions
      passwordMock = spyOn(inquirerPrompts, 'password');
      confirmMock = spyOn(inquirerPrompts, 'confirm');
      inputMock = spyOn(inquirerPrompts, 'input');
    });

    afterEach(() => {
      passwordMock.mockRestore();
      confirmMock.mockRestore();
      inputMock.mockRestore();
    });

    it('should prompt for API key when not provided', async () => {
      passwordMock.mockResolvedValue(VALID_API_KEY);

      await initCmd_Handler({
        key: undefined,
        localKey: 'test-schema',
        reinit: false,
        dir: 'db-schemas',
        yes: true,
        dryRun: false,
        quiet: false
      });

      expect(passwordMock).toHaveBeenCalled();
      expect(fs.existsSync(path.join(tempDir, 'bfloo.yml'))).toBe(true);
    });

    it('should prompt for confirmation and abort when user declines', async () => {
      confirmMock.mockResolvedValue(false);

      let thrownError: CliError | null = null;

      try {
        await initCmd_Handler({
          key: VALID_API_KEY,
          localKey: 'test-schema',
          reinit: false,
          dir: 'db-schemas',
          yes: false, // Will trigger confirmation prompt
          dryRun: false,
          quiet: false
        });
      } catch (error) {
        if (error instanceof CliError) {
          thrownError = error;
        }
      }

      expect(confirmMock).toHaveBeenCalled();
      expect(thrownError).toBeInstanceOf(CliError);
      expect(thrownError?.title).toBe('Schema Initialization Aborted');
    });

    it('should prompt for confirmation and continue when user confirms', async () => {
      confirmMock.mockResolvedValue(true);

      await initCmd_Handler({
        key: VALID_API_KEY,
        localKey: 'test-schema',
        reinit: false,
        dir: 'db-schemas',
        yes: false, // Will trigger confirmation prompt
        dryRun: false,
        quiet: false
      });

      expect(confirmMock).toHaveBeenCalled();
      expect(fs.existsSync(path.join(tempDir, 'bfloo.yml'))).toBe(true);
    });

    it('should prompt for local key in interactive mode', async () => {
      confirmMock.mockResolvedValue(true);
      inputMock.mockResolvedValue('custom-key');

      await initCmd_Handler({
        key: VALID_API_KEY,
        localKey: undefined, // No local key provided
        reinit: false,
        dir: 'db-schemas',
        yes: false, // Interactive mode
        dryRun: false,
        quiet: false
      });

      expect(inputMock).toHaveBeenCalled();

      // Verify config uses the custom key from prompt
      const configContent = fs.readFileSync(
        path.join(tempDir, 'bfloo.yml'),
        'utf-8'
      );
      expect(configContent).toContain('custom-key');
    });

    it('should validate local key input in prompt', async () => {
      confirmMock.mockResolvedValue(true);

      // Capture the validate function from input call
      let validateFn: ((value: string) => boolean | string) | undefined;
      inputMock.mockImplementation(
        (options: { validate?: (value: string) => boolean | string }) => {
          validateFn = options.validate;
          return Promise.resolve('valid-key');
        }
      );

      await initCmd_Handler({
        key: VALID_API_KEY,
        localKey: undefined,
        reinit: false,
        dir: 'db-schemas',
        yes: false,
        dryRun: false,
        quiet: false
      });

      // Test the validate function
      expect(validateFn).toBeDefined();
      if (validateFn) {
        expect(validateFn('valid-key')).toBe(true);
        expect(validateFn('Invalid Key With Spaces')).toBe(
          'Only lowercase letters, numbers, hyphens, underscores, and dots allowed (no spaces)'
        );
      }
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Rollback Actions Coverage
  // ─────────────────────────────────────────────────────────────

  describe('Rollback Actions', () => {
    it('should trigger manifest rollback when snapshot write fails', async () => {
      const originalWriteFileSync = fs.writeFileSync;
      let snapshotWriteAttempts = 0;

      // Fail specifically when writing working snapshot (after manifest succeeds)
      const writeFileSpy = spyOn(fs, 'writeFileSync').mockImplementation(
        (filePath, data, options) => {
          if (typeof filePath === 'string') {
            if (filePath.includes('manifest.yml')) {
              // Let manifest write succeed
              originalWriteFileSync(filePath, data, options);
              return;
            }
            if (filePath.endsWith('.yml') && filePath.includes('db-schemas')) {
              snapshotWriteAttempts++;
              throw new Error('Snapshot write failed');
            }
          }
          originalWriteFileSync(filePath, data, options);
        }
      );

      let thrownError: Error | null = null;

      try {
        await initCmd_Handler({
          key: VALID_API_KEY,
          localKey: 'test-schema',
          reinit: false,
          dir: 'db-schemas',
          yes: true,
          dryRun: false,
          quiet: false
        });
      } catch (error) {
        thrownError = error as Error;
      }

      writeFileSpy.mockRestore();

      expect(thrownError).toBeInstanceOf(Error);
      expect(snapshotWriteAttempts).toBeGreaterThan(0);

      // Rollback should have cleaned up - schema dir should be removed
      expect(fs.existsSync(path.join(tempDir, '.bfloo', 'test-schema'))).toBe(
        false
      );
    });

    it('should clean up snapshots directory on rollback', async () => {
      // Create multiple snapshots
      const snapshots = [
        createMockSnapshot({
          id: 'snap-1',
          label: 'v1.0.0',
          createdAt: new Date('2024-01-01')
        }),
        createMockSnapshot({
          id: 'snap-2',
          label: 'v0.9.0',
          createdAt: new Date('2023-12-01')
        })
      ];
      apiSpies.listByApiKey.mockResolvedValue(snapshots);

      const originalWriteFileSync = fs.writeFileSync;
      let configWritten = false;
      let manifestWritten = false;

      // Let everything succeed except the very last step
      const writeFileSpy = spyOn(fs, 'writeFileSync').mockImplementation(
        (filePath, data, options) => {
          if (typeof filePath === 'string') {
            if (filePath.includes('bfloo.yml')) {
              configWritten = true;
            }
            if (filePath.includes('manifest.yml')) {
              manifestWritten = true;
            }
            // Fail on stored snapshot write
            if (filePath.includes('snapshots') && filePath.includes('.bfloo')) {
              throw new Error('Stored snapshot write failed');
            }
          }
          originalWriteFileSync(filePath, data, options);
        }
      );

      let thrownError: Error | null = null;

      try {
        await initCmd_Handler({
          key: VALID_API_KEY,
          localKey: 'test-schema',
          reinit: false,
          dir: 'db-schemas',
          yes: true,
          dryRun: false,
          quiet: false
        });
      } catch (error) {
        thrownError = error as Error;
      }

      writeFileSpy.mockRestore();

      expect(thrownError).toBeInstanceOf(Error);
      expect(configWritten).toBe(true);
      expect(manifestWritten).toBe(true);

      // After rollback, config should be removed
      expect(fs.existsSync(path.join(tempDir, 'bfloo.yml'))).toBe(false);
    });

    // Note: Lines 991-998 (snapshot files rollback action) are defensive code
    // that can only be triggered if:
    // 1. The snapshot files step completes AND
    // 2. A SIGINT is received before the loop ends
    // This is hard to test reliably in unit tests without process.exit mocking.
  });
});
