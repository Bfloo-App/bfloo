// Package imports
import { describe, it, expect, beforeEach, afterEach, spyOn } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';
import type z from 'zod';

// Project imports
import {
  getSchemaSnapshotDir,
  getManifestPath,
  getSnapshotFilename,
  manifestExists,
  readManifest,
  writeManifest,
  buildManifestFromSnapshots,
  findSchemaIdInManifests
} from '../../src/fs/manifest';
import * as hashUtils from '../../src/utils/hash';
import type {
  getManifestSchema,
  getManifestSnapshotEntrySchema,
  SchemaSnapshot_Schema
} from '../../src/schemas';
import { PATHS } from '../../src/constants';

// Valid UUIDv4 format for testing (version 4, variant 1)
const VALID_UUID = 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d';
const VALID_SCHEMA_ID = 'b2c3d4e5-f6a7-4b2c-9d3e-4f5a6b7c8d9e';

// Helper to create valid manifest entry
function createManifestEntry(
  overrides: Partial<
    z.infer<ReturnType<typeof getManifestSnapshotEntrySchema>>
  > = {}
): z.infer<ReturnType<typeof getManifestSnapshotEntrySchema>> {
  return {
    label: 'v1.0.0',
    'parent-id': null,
    status: 'draft',
    'database-version': 'v15.0',
    'created-at': '2024-01-01T00:00:00.000Z',
    file: 'current',
    'content-hash':
      'sha256:0000000000000000000000000000000000000000000000000000000000000000',
    'sync-state': 'synced',
    'synced-at': '2024-01-01T00:00:00.000Z',
    ...overrides
  } as z.infer<ReturnType<typeof getManifestSnapshotEntrySchema>>;
}

// Helper to create valid manifest
function createManifest(
  overrides: Partial<z.infer<ReturnType<typeof getManifestSchema>>> = {}
): z.infer<ReturnType<typeof getManifestSchema>> {
  return {
    'schema-id': VALID_SCHEMA_ID,
    snapshots: {
      [VALID_UUID]: createManifestEntry()
    },
    ...overrides
  };
}

// Helper to create valid snapshot
function createSnapshot(
  overrides: Partial<z.infer<typeof SchemaSnapshot_Schema>> = {}
): z.infer<typeof SchemaSnapshot_Schema> {
  return {
    id: 'snapshot-123',
    schemaId: 'schema-456',
    parentId: null,
    label: 'v1.0.0',
    description: null,
    engine: 'postgresql',
    engineVersion: 'v15.0',
    engineKey: 'postgresql:v15.0',
    status: 'draft',
    contentHash:
      'sha256:0000000000000000000000000000000000000000000000000000000000000000',
    data: null,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides
  } as z.infer<typeof SchemaSnapshot_Schema>;
}

describe('[Unit] - getSchemaSnapshotDir', () => {
  describe('Basic Functionality', () => {
    it('should return path to schema snapshot directory', () => {
      const result = getSchemaSnapshotDir('/projects/my-app', 'my-schema');
      expect(result).toBe(
        path.join('/projects/my-app', PATHS.bflooDir, 'my-schema')
      );
    });

    it('should handle different schema names', () => {
      const result = getSchemaSnapshotDir('/projects/my-app', 'another-schema');
      expect(result).toBe(
        path.join('/projects/my-app', PATHS.bflooDir, 'another-schema')
      );
    });
  });
});

describe('[Unit] - getManifestPath', () => {
  describe('Basic Functionality', () => {
    it('should return path to manifest file', () => {
      const result = getManifestPath('/projects/my-app', 'my-schema');
      expect(result).toBe(
        path.join(
          '/projects/my-app',
          PATHS.bflooDir,
          'my-schema',
          PATHS.manifestFile
        )
      );
    });
  });
});

describe('[Unit] - getSnapshotFilename', () => {
  describe('Basic Functionality', () => {
    it('should generate filename with date and label', () => {
      const result = getSnapshotFilename('2024-06-15T10:30:00Z', 'v1.0.0');
      expect(result).toBe('2024-06-15_v1.0.0.yml');
    });

    it('should handle Date object input', () => {
      const date = new Date('2024-06-15T10:30:00Z');
      const result = getSnapshotFilename(date, 'initial');
      expect(result).toBe('2024-06-15_initial.yml');
    });

    it('should handle different label formats', () => {
      const result = getSnapshotFilename('2024-01-01T00:00:00Z', 'my-snapshot');
      expect(result).toBe('2024-01-01_my-snapshot.yml');
    });
  });

  describe('Edge Cases', () => {
    it('should handle labels with special characters', () => {
      const result = getSnapshotFilename('2024-01-01T00:00:00Z', 'v1.0.0-beta');
      expect(result).toBe('2024-01-01_v1.0.0-beta.yml');
    });

    it('should extract date correctly regardless of time', () => {
      const result1 = getSnapshotFilename('2024-06-15T00:00:00Z', 'label');
      const result2 = getSnapshotFilename('2024-06-15T23:59:59Z', 'label');
      expect(result1).toBe(result2);
    });
  });
});

describe('[Unit] - manifestExists', () => {
  let existsSyncSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    existsSyncSpy = spyOn(fs, 'existsSync');
  });

  afterEach(() => {
    existsSyncSpy.mockRestore();
  });

  describe('Basic Functionality', () => {
    it('should return true when manifest exists', () => {
      existsSyncSpy.mockReturnValue(true);

      const result = manifestExists('/projects/my-app', 'my-schema');
      expect(result).toBe(true);
    });

    it('should return false when manifest does not exist', () => {
      existsSyncSpy.mockReturnValue(false);

      const result = manifestExists('/projects/my-app', 'my-schema');
      expect(result).toBe(false);
    });

    it('should check correct path', () => {
      existsSyncSpy.mockReturnValue(false);

      manifestExists('/projects/my-app', 'my-schema');

      const expectedPath = path.join(
        '/projects/my-app',
        PATHS.bflooDir,
        'my-schema',
        PATHS.manifestFile
      );
      expect(existsSyncSpy).toHaveBeenCalledWith(expectedPath);
    });
  });
});

describe('[Unit] - readManifest', () => {
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
    it('should read and parse valid manifest', () => {
      const validYaml = `
schema-id: ${VALID_SCHEMA_ID}
snapshots:
  ${VALID_UUID}:
    label: v1.0.0
    parent-id: null
    status: draft
    database-version: v15.0
    created-at: "2024-01-01T00:00:00.000Z"
    file: current
    content-hash: "sha256:0000000000000000000000000000000000000000000000000000000000000000"
    sync-state: synced
    synced-at: "2024-01-01T00:00:00.000Z"
`;
      existsSyncSpy.mockReturnValue(true);
      readFileSyncSpy.mockReturnValue(validYaml);

      const result = readManifest(
        '/projects/my-app',
        'my-schema',
        'postgresql'
      );

      expect(result['schema-id']).toBe(VALID_SCHEMA_ID);
      expect(result.snapshots[VALID_UUID]).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should throw CliError when manifest not found', () => {
      existsSyncSpy.mockReturnValue(false);

      expect(() =>
        readManifest('/projects/my-app', 'my-schema', 'postgresql')
      ).toThrow('Could not find manifest file');
    });

    it('should throw CliError when manifest is invalid', () => {
      const invalidYaml = `
schema-id: schema-123
snapshots:
  snapshot-1:
    invalid: data
`;
      existsSyncSpy.mockReturnValue(true);
      readFileSyncSpy.mockReturnValue(invalidYaml);

      expect(() =>
        readManifest('/projects/my-app', 'my-schema', 'postgresql')
      ).toThrow('manifest file');
    });
  });
});

describe('[Unit] - writeManifest', () => {
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
    it('should write manifest to correct path', () => {
      existsSyncSpy.mockReturnValue(true);
      const manifest = createManifest();

      writeManifest('/projects/my-app', 'my-schema', manifest);

      const expectedPath = path.join(
        '/projects/my-app',
        PATHS.bflooDir,
        'my-schema',
        PATHS.manifestFile
      );
      expect(writeFileSyncSpy).toHaveBeenCalledWith(
        expectedPath,
        expect.any(String),
        'utf-8'
      );
    });

    it('should create directory if it does not exist', () => {
      existsSyncSpy.mockReturnValue(false);
      const manifest = createManifest();

      writeManifest('/projects/my-app', 'my-schema', manifest);

      expect(mkdirSyncSpy).toHaveBeenCalledWith(
        expect.stringContaining('my-schema'),
        { recursive: true }
      );
    });

    it('should include warning comment in output', () => {
      existsSyncSpy.mockReturnValue(true);
      const manifest = createManifest();

      writeManifest('/projects/my-app', 'my-schema', manifest);

      const writtenContent = writeFileSyncSpy.mock.calls[0]?.[1] as string;
      expect(writtenContent).toContain('WARNING');
      expect(writtenContent).toContain('managed by bfloo CLI');
    });

    it('should write valid YAML', () => {
      existsSyncSpy.mockReturnValue(true);
      const manifest = createManifest();

      writeManifest('/projects/my-app', 'my-schema', manifest);

      const writtenContent = writeFileSyncSpy.mock.calls[0]?.[1] as string;
      expect(writtenContent).toContain('schema-id:');
      expect(writtenContent).toContain('snapshots:');
    });
  });
});

describe('[Unit] - buildManifestFromSnapshots', () => {
  let computeHashSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    computeHashSpy = spyOn(hashUtils, 'computeSnapshotContentHash');
  });

  afterEach(() => {
    computeHashSpy.mockRestore();
  });

  describe('Basic Functionality', () => {
    it('should build manifest from single snapshot', () => {
      const expectedHash =
        'sha256:0000000000000000000000000000000000000000000000000000000000000000';
      computeHashSpy.mockReturnValue(expectedHash);

      const snapshot = createSnapshot({
        id: 'snap-1',
        schemaId: 'schema-123',
        label: 'v1.0.0',
        contentHash: expectedHash,
        createdAt: new Date('2024-01-15T00:00:00Z')
      });

      const result = buildManifestFromSnapshots('schema-123', [snapshot]);

      expect(result['schema-id']).toBe('schema-123');
      expect(result.snapshots['snap-1']).toBeDefined();
      expect(result.snapshots['snap-1']?.label).toBe('v1.0.0');
      expect(result.snapshots['snap-1']?.file).toBe('current');
      expect(result.snapshots['snap-1']?.['sync-state']).toBe('synced');
      expect(result.snapshots['snap-1']?.['content-hash']).toBe(expectedHash);
    });

    it('should mark latest snapshot as current', () => {
      const expectedHash =
        'sha256:0000000000000000000000000000000000000000000000000000000000000000';
      computeHashSpy.mockReturnValue(expectedHash);

      const olderSnapshot = createSnapshot({
        id: 'snap-old',
        schemaId: 'schema-123',
        label: 'v1.0.0',
        contentHash: expectedHash,
        createdAt: new Date('2024-01-01T00:00:00Z')
      });
      const newerSnapshot = createSnapshot({
        id: 'snap-new',
        schemaId: 'schema-123',
        label: 'v2.0.0',
        contentHash: expectedHash,
        createdAt: new Date('2024-06-15T00:00:00Z')
      });

      const result = buildManifestFromSnapshots('schema-123', [
        olderSnapshot,
        newerSnapshot
      ]);

      // Newer snapshot should be marked as current
      expect(result.snapshots['snap-new']?.file).toBe('current');
      // Older snapshot should have a filename
      expect(result.snapshots['snap-old']?.file).toBe('2024-01-01_v1.0.0.yml');
    });

    it('should build manifest with multiple snapshots', () => {
      const expectedHash =
        'sha256:0000000000000000000000000000000000000000000000000000000000000000';
      computeHashSpy.mockReturnValue(expectedHash);

      const snapshot1 = createSnapshot({
        id: 'snap-1',
        schemaId: 'schema-123',
        label: 'v1.0.0',
        parentId: null,
        contentHash: expectedHash,
        createdAt: new Date('2024-01-01T00:00:00Z')
      });
      const snapshot2 = createSnapshot({
        id: 'snap-2',
        schemaId: 'schema-123',
        label: 'v1.1.0',
        parentId: 'snap-1',
        contentHash: expectedHash,
        createdAt: new Date('2024-03-01T00:00:00Z')
      });
      const snapshot3 = createSnapshot({
        id: 'snap-3',
        schemaId: 'schema-123',
        label: 'v2.0.0',
        parentId: 'snap-2',
        contentHash: expectedHash,
        createdAt: new Date('2024-06-01T00:00:00Z')
      });

      const result = buildManifestFromSnapshots('schema-123', [
        snapshot1,
        snapshot2,
        snapshot3
      ]);

      expect(Object.keys(result.snapshots)).toHaveLength(3);
      expect(result.snapshots['snap-3']?.file).toBe('current');
      expect(result.snapshots['snap-2']?.file).toBe('2024-03-01_v1.1.0.yml');
      expect(result.snapshots['snap-1']?.file).toBe('2024-01-01_v1.0.0.yml');
      expect(result.snapshots['snap-2']?.['parent-id']).toBe('snap-1');
      expect(result.snapshots['snap-3']?.['parent-id']).toBe('snap-2');
    });

    it('should preserve all snapshot metadata in manifest entries', () => {
      const expectedHash =
        'sha256:abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789';
      computeHashSpy.mockReturnValue(expectedHash);

      const snapshot = createSnapshot({
        id: 'snap-1',
        schemaId: 'schema-123',
        label: 'v1.0.0',
        parentId: 'parent-snap',
        status: 'done',
        engineVersion: 'v15.0',
        contentHash: expectedHash,
        createdAt: new Date('2024-05-15T12:30:00Z')
      });

      const result = buildManifestFromSnapshots('schema-123', [snapshot]);

      const entry = result.snapshots['snap-1'];
      expect(entry?.label).toBe('v1.0.0');
      expect(entry?.['parent-id']).toBe('parent-snap');
      expect(entry?.status).toBe('done');
      expect(entry?.['database-version']).toBe('v15.0');
      expect(entry?.['content-hash']).toBe(expectedHash);
      expect(entry?.['created-at']).toBe('2024-05-15T12:30:00.000Z');
      expect(entry?.['synced-at']).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should throw when snapshot array is empty', () => {
      expect(() => buildManifestFromSnapshots('schema-123', [])).toThrow(
        'Failed to determine current snapshot'
      );
    });

    it('should throw on hash mismatch', () => {
      computeHashSpy.mockReturnValue(
        'sha256:computed_hash_that_differs_from_stored'
      );

      const snapshot = createSnapshot({
        contentHash: 'sha256:wrong_hash_that_will_not_match_computed_value'
      });

      expect(() =>
        buildManifestFromSnapshots('schema-123', [snapshot])
      ).toThrow('Content hash mismatch');
    });
  });
});

describe('[Unit] - findSchemaIdInManifests', () => {
  let existsSyncSpy: ReturnType<typeof spyOn>;
  let readdirSyncSpy: ReturnType<typeof spyOn>;
  let readFileSyncSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    existsSyncSpy = spyOn(fs, 'existsSync');
    readdirSyncSpy = spyOn(fs, 'readdirSync');
    readFileSyncSpy = spyOn(fs, 'readFileSync');
  });

  afterEach(() => {
    existsSyncSpy.mockRestore();
    readdirSyncSpy.mockRestore();
    readFileSyncSpy.mockRestore();
  });

  describe('Basic Functionality', () => {
    it('should return null when .bfloo directory does not exist', () => {
      existsSyncSpy.mockReturnValue(false);

      const result = findSchemaIdInManifests('/projects/my-app', 'schema-123');
      expect(result).toBeNull();
    });

    it('should return local key when schema ID is found', () => {
      existsSyncSpy.mockImplementation((p: string) => {
        // .bfloo dir exists
        if (p.endsWith('.bfloo')) return true;
        // manifest file exists
        if (p.includes('manifest.yml')) return true;
        return false;
      });

      readdirSyncSpy.mockReturnValue([
        { name: 'my-schema', isDirectory: () => true }
      ] as fs.Dirent[]);

      readFileSyncSpy.mockReturnValue('schema-id: schema-123\nsnapshots: {}');

      const result = findSchemaIdInManifests('/projects/my-app', 'schema-123');
      expect(result).toBe('my-schema');
    });

    it('should return null when schema ID is not found', () => {
      existsSyncSpy.mockImplementation((p: string) => {
        if (p.endsWith('.bfloo')) return true;
        if (p.includes('manifest.yml')) return true;
        return false;
      });

      readdirSyncSpy.mockReturnValue([
        { name: 'my-schema', isDirectory: () => true }
      ] as fs.Dirent[]);

      readFileSyncSpy.mockReturnValue('schema-id: other-schema\nsnapshots: {}');

      const result = findSchemaIdInManifests('/projects/my-app', 'schema-123');
      expect(result).toBeNull();
    });

    it('should skip non-directory entries', () => {
      existsSyncSpy.mockImplementation((p: string) => {
        if (p.endsWith('.bfloo')) return true;
        return false;
      });

      readdirSyncSpy.mockReturnValue([
        { name: 'some-file.txt', isDirectory: () => false },
        { name: 'my-schema', isDirectory: () => true }
      ] as fs.Dirent[]);

      readFileSyncSpy.mockReturnValue('schema-id: schema-123\nsnapshots: {}');

      existsSyncSpy.mockImplementation((p: string) => {
        if (p.endsWith('.bfloo')) return true;
        if (p.includes('my-schema') && p.includes('manifest.yml')) return true;
        return false;
      });

      const result = findSchemaIdInManifests('/projects/my-app', 'schema-123');
      expect(result).toBe('my-schema');
    });

    it('should skip manifests that cannot be read', () => {
      existsSyncSpy.mockImplementation((p: string) => {
        if (p.endsWith('.bfloo')) return true;
        if (p.includes('manifest.yml')) return true;
        return false;
      });

      readdirSyncSpy.mockReturnValue([
        { name: 'bad-schema', isDirectory: () => true },
        { name: 'good-schema', isDirectory: () => true }
      ] as fs.Dirent[]);

      let callCount = 0;
      readFileSyncSpy.mockImplementation(() => {
        callCount++;
        if (callCount === 1) throw new Error('Read error');
        return 'schema-id: schema-123\nsnapshots: {}';
      });

      const result = findSchemaIdInManifests('/projects/my-app', 'schema-123');
      expect(result).toBe('good-schema');
    });
  });
});
