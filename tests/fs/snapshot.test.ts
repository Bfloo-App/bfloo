// Package imports
import { describe, it, expect, beforeEach, afterEach, spyOn } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';
import type z from 'zod';

// Project imports
import {
  getSnapshotsDir,
  getStoredSnapshotPath,
  getWorkingSnapshotPath,
  storedSnapshotExists,
  readStoredSnapshot,
  writeStoredSnapshot,
  workingSnapshotExists,
  readWorkingSnapshot,
  writeWorkingSnapshot
} from '../../src/fs/snapshot';
import type {
  getStoredSnapshotSchema,
  getWorkingSnapshotSchema
} from '../../src/schemas';
import { PATHS } from '../../src/constants';

// Helper to create valid stored snapshot
function createStoredSnapshot(
  overrides: Partial<z.infer<ReturnType<typeof getStoredSnapshotSchema>>> = {}
): z.infer<ReturnType<typeof getStoredSnapshotSchema>> {
  return {
    description: null,
    tables: [],
    ...overrides
  } as z.infer<ReturnType<typeof getStoredSnapshotSchema>>;
}

// Helper to create valid working snapshot
function createWorkingSnapshot(
  overrides: Partial<z.infer<ReturnType<typeof getWorkingSnapshotSchema>>> = {}
): z.infer<ReturnType<typeof getWorkingSnapshotSchema>> {
  return {
    schema: {
      name: 'My Schema',
      description: 'Test schema'
    },
    snapshot: {
      label: 'v1.0.0',
      'engine-version': 'v15.0',
      description: null,
      tables: []
    },
    ...overrides
  } as z.infer<ReturnType<typeof getWorkingSnapshotSchema>>;
}

describe('[Unit] - getSnapshotsDir', () => {
  describe('Basic Functionality', () => {
    it('should return path to snapshots directory', () => {
      const result = getSnapshotsDir('/projects/my-app', 'my-schema');
      expect(result).toBe(
        path.join(
          '/projects/my-app',
          PATHS.bflooDir,
          'my-schema',
          PATHS.snapshotsDir
        )
      );
    });

    it('should handle different schema names', () => {
      const result = getSnapshotsDir('/projects/my-app', 'another-schema');
      expect(result).toContain('another-schema');
      expect(result).toContain(PATHS.snapshotsDir);
    });
  });
});

describe('[Unit] - getStoredSnapshotPath', () => {
  describe('Basic Functionality', () => {
    it('should return path to stored snapshot file', () => {
      const result = getStoredSnapshotPath(
        '/projects/my-app',
        'my-schema',
        '2024-01-01_v1.0.0.yml'
      );
      expect(result).toBe(
        path.join(
          '/projects/my-app',
          PATHS.bflooDir,
          'my-schema',
          PATHS.snapshotsDir,
          '2024-01-01_v1.0.0.yml'
        )
      );
    });
  });
});

describe('[Unit] - getWorkingSnapshotPath', () => {
  describe('Basic Functionality', () => {
    it('should return path to working snapshot file', () => {
      const result = getWorkingSnapshotPath(
        '/projects/my-app',
        'db-schemas',
        'my-schema'
      );
      expect(result).toBe(
        path.join('/projects/my-app', 'db-schemas', 'my-schema.yml')
      );
    });

    it('should handle nested schema directories', () => {
      const result = getWorkingSnapshotPath(
        '/projects/my-app',
        'src/db/schemas',
        'my-schema'
      );
      expect(result).toBe(
        path.join('/projects/my-app', 'src/db/schemas', 'my-schema.yml')
      );
    });
  });
});

describe('[Unit] - storedSnapshotExists', () => {
  let existsSyncSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    existsSyncSpy = spyOn(fs, 'existsSync');
  });

  afterEach(() => {
    existsSyncSpy.mockRestore();
  });

  describe('Basic Functionality', () => {
    it('should return true when snapshot exists', () => {
      existsSyncSpy.mockReturnValue(true);

      const result = storedSnapshotExists(
        '/projects/my-app',
        'my-schema',
        '2024-01-01_v1.0.0.yml'
      );
      expect(result).toBe(true);
    });

    it('should return false when snapshot does not exist', () => {
      existsSyncSpy.mockReturnValue(false);

      const result = storedSnapshotExists(
        '/projects/my-app',
        'my-schema',
        '2024-01-01_v1.0.0.yml'
      );
      expect(result).toBe(false);
    });
  });
});

describe('[Unit] - readStoredSnapshot', () => {
  let existsSyncSpy: ReturnType<typeof spyOn>;
  let readFileSyncSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    existsSyncSpy = spyOn(fs, 'existsSync');
    readFileSyncSpy = spyOn(fs, 'readFileSync');
  });

  afterEach(() => {
    existsSyncSpy.mockRestore();
    readFileSyncSpy.mockRestore();
  });

  describe('Basic Functionality', () => {
    it('should read and parse valid stored snapshot', () => {
      const validYaml = `
description: Test snapshot
tables: []
`;
      existsSyncSpy.mockReturnValue(true);
      readFileSyncSpy.mockReturnValue(validYaml);

      const result = readStoredSnapshot(
        '/projects/my-app',
        'my-schema',
        '2024-01-01_v1.0.0.yml',
        'postgresql:v15.0'
      );

      expect(result.description).toBe('Test snapshot');
      expect(result.tables).toEqual([]);
    });

    it('should handle missing description (optional field)', () => {
      const validYaml = `
tables: []
`;
      existsSyncSpy.mockReturnValue(true);
      readFileSyncSpy.mockReturnValue(validYaml);

      const result = readStoredSnapshot(
        '/projects/my-app',
        'my-schema',
        '2024-01-01_v1.0.0.yml',
        'postgresql:v15.0'
      );

      expect(result.description).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should throw CliError when snapshot not found', () => {
      existsSyncSpy.mockReturnValue(false);

      expect(() =>
        readStoredSnapshot(
          '/projects/my-app',
          'my-schema',
          '2024-01-01_v1.0.0.yml',
          'postgresql:v15.0'
        )
      ).toThrow('Could not find stored snapshot');
    });

    it('should throw CliError when snapshot is invalid', () => {
      const invalidYaml = `
invalid: data
extra_field: not_allowed
`;
      existsSyncSpy.mockReturnValue(true);
      readFileSyncSpy.mockReturnValue(invalidYaml);

      expect(() =>
        readStoredSnapshot(
          '/projects/my-app',
          'my-schema',
          '2024-01-01_v1.0.0.yml',
          'postgresql:v15.0'
        )
      ).toThrow('stored snapshot');
    });
  });
});

describe('[Unit] - writeStoredSnapshot', () => {
  let existsSyncSpy: ReturnType<typeof spyOn>;
  let mkdirSyncSpy: ReturnType<typeof spyOn>;
  let writeFileSyncSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    existsSyncSpy = spyOn(fs, 'existsSync');
    mkdirSyncSpy = spyOn(fs, 'mkdirSync').mockImplementation(() => '');
    writeFileSyncSpy = spyOn(fs, 'writeFileSync').mockImplementation(() => {});
  });

  afterEach(() => {
    existsSyncSpy.mockRestore();
    mkdirSyncSpy.mockRestore();
    writeFileSyncSpy.mockRestore();
  });

  describe('Basic Functionality', () => {
    it('should write snapshot to correct path', () => {
      existsSyncSpy.mockReturnValue(true);
      const snapshot = createStoredSnapshot();

      writeStoredSnapshot(
        '/projects/my-app',
        'my-schema',
        '2024-01-01_v1.0.0.yml',
        snapshot
      );

      expect(writeFileSyncSpy).toHaveBeenCalledWith(
        expect.stringContaining('2024-01-01_v1.0.0.yml'),
        expect.any(String),
        'utf-8'
      );
    });

    it('should create directory if it does not exist', () => {
      existsSyncSpy.mockReturnValue(false);
      const snapshot = createStoredSnapshot();

      writeStoredSnapshot(
        '/projects/my-app',
        'my-schema',
        '2024-01-01_v1.0.0.yml',
        snapshot
      );

      expect(mkdirSyncSpy).toHaveBeenCalledWith(
        expect.stringContaining(PATHS.snapshotsDir),
        { recursive: true }
      );
    });

    it('should write valid YAML', () => {
      existsSyncSpy.mockReturnValue(true);
      const snapshot = createStoredSnapshot({ description: 'Test' });

      writeStoredSnapshot(
        '/projects/my-app',
        'my-schema',
        '2024-01-01_v1.0.0.yml',
        snapshot
      );

      const writtenContent = writeFileSyncSpy.mock.calls[0]?.[1] as string;
      expect(writtenContent).toContain('description: Test');
      expect(writtenContent).toContain('tables:');
    });
  });
});

describe('[Unit] - workingSnapshotExists', () => {
  let existsSyncSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    existsSyncSpy = spyOn(fs, 'existsSync');
  });

  afterEach(() => {
    existsSyncSpy.mockRestore();
  });

  describe('Basic Functionality', () => {
    it('should return true when working snapshot exists', () => {
      existsSyncSpy.mockReturnValue(true);

      const result = workingSnapshotExists(
        '/projects/my-app',
        'db-schemas',
        'my-schema'
      );
      expect(result).toBe(true);
    });

    it('should return false when working snapshot does not exist', () => {
      existsSyncSpy.mockReturnValue(false);

      const result = workingSnapshotExists(
        '/projects/my-app',
        'db-schemas',
        'my-schema'
      );
      expect(result).toBe(false);
    });

    it('should check correct path', () => {
      existsSyncSpy.mockReturnValue(false);

      workingSnapshotExists('/projects/my-app', 'db-schemas', 'my-schema');

      expect(existsSyncSpy).toHaveBeenCalledWith(
        path.join('/projects/my-app', 'db-schemas', 'my-schema.yml')
      );
    });
  });
});

describe('[Unit] - readWorkingSnapshot', () => {
  let existsSyncSpy: ReturnType<typeof spyOn>;
  let readFileSyncSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    existsSyncSpy = spyOn(fs, 'existsSync');
    readFileSyncSpy = spyOn(fs, 'readFileSync');
  });

  afterEach(() => {
    existsSyncSpy.mockRestore();
    readFileSyncSpy.mockRestore();
  });

  describe('Basic Functionality', () => {
    it('should read and parse valid working snapshot', () => {
      const validYaml = `
schema:
  name: My Schema
  description: Test description
snapshot:
  label: v1.0.0
  engine-version: v15.0
  tables: []
`;
      existsSyncSpy.mockReturnValue(true);
      readFileSyncSpy.mockReturnValue(validYaml);

      const result = readWorkingSnapshot(
        '/projects/my-app',
        'db-schemas',
        'my-schema',
        'postgresql:v15.0'
      );

      expect(result.schema.name).toBe('My Schema');
      expect(result.snapshot?.label).toBe('v1.0.0');
    });

    it('should handle working snapshot without snapshot section', () => {
      const validYaml = `
schema:
  name: My Schema
`;
      existsSyncSpy.mockReturnValue(true);
      readFileSyncSpy.mockReturnValue(validYaml);

      const result = readWorkingSnapshot(
        '/projects/my-app',
        'db-schemas',
        'my-schema',
        'postgresql:v15.0'
      );

      expect(result.schema.name).toBe('My Schema');
      expect(result.snapshot).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should throw CliError when working snapshot not found', () => {
      existsSyncSpy.mockReturnValue(false);

      expect(() =>
        readWorkingSnapshot(
          '/projects/my-app',
          'db-schemas',
          'my-schema',
          'postgresql:v15.0'
        )
      ).toThrow('Could not find working snapshot');
    });

    it('should throw CliError when working snapshot is invalid', () => {
      const invalidYaml = `
invalid: data
`;
      existsSyncSpy.mockReturnValue(true);
      readFileSyncSpy.mockReturnValue(invalidYaml);

      expect(() =>
        readWorkingSnapshot(
          '/projects/my-app',
          'db-schemas',
          'my-schema',
          'postgresql:v15.0'
        )
      ).toThrow('working snapshot');
    });
  });
});

describe('[Unit] - writeWorkingSnapshot', () => {
  let existsSyncSpy: ReturnType<typeof spyOn>;
  let mkdirSyncSpy: ReturnType<typeof spyOn>;
  let writeFileSyncSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    existsSyncSpy = spyOn(fs, 'existsSync');
    mkdirSyncSpy = spyOn(fs, 'mkdirSync').mockImplementation(() => '');
    writeFileSyncSpy = spyOn(fs, 'writeFileSync').mockImplementation(() => {});
  });

  afterEach(() => {
    existsSyncSpy.mockRestore();
    mkdirSyncSpy.mockRestore();
    writeFileSyncSpy.mockRestore();
  });

  describe('Basic Functionality', () => {
    it('should write working snapshot to correct path', () => {
      existsSyncSpy.mockReturnValue(true);
      const snapshot = createWorkingSnapshot();

      writeWorkingSnapshot(
        '/projects/my-app',
        'db-schemas',
        'my-schema',
        snapshot
      );

      expect(writeFileSyncSpy).toHaveBeenCalledWith(
        path.join('/projects/my-app', 'db-schemas', 'my-schema.yml'),
        expect.any(String),
        'utf-8'
      );
    });

    it('should create directory if it does not exist', () => {
      existsSyncSpy.mockReturnValue(false);
      const snapshot = createWorkingSnapshot();

      writeWorkingSnapshot(
        '/projects/my-app',
        'db-schemas',
        'my-schema',
        snapshot
      );

      expect(mkdirSyncSpy).toHaveBeenCalledWith(
        path.join('/projects/my-app', 'db-schemas'),
        { recursive: true }
      );
    });

    it('should include comment about detached schema info', () => {
      existsSyncSpy.mockReturnValue(true);
      const snapshot = createWorkingSnapshot();

      writeWorkingSnapshot(
        '/projects/my-app',
        'db-schemas',
        'my-schema',
        snapshot
      );

      const writtenContent = writeFileSyncSpy.mock.calls[0]?.[1] as string;
      expect(writtenContent).toContain('NOTE');
      expect(writtenContent).toContain('detached from remote');
    });

    it('should write valid YAML structure', () => {
      existsSyncSpy.mockReturnValue(true);
      const snapshot = createWorkingSnapshot();

      writeWorkingSnapshot(
        '/projects/my-app',
        'db-schemas',
        'my-schema',
        snapshot
      );

      const writtenContent = writeFileSyncSpy.mock.calls[0]?.[1] as string;
      expect(writtenContent).toContain('schema:');
      expect(writtenContent).toContain('name:');
      expect(writtenContent).toContain('snapshot:');
      expect(writtenContent).toContain('label:');
    });
  });
});
