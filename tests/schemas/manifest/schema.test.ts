// Package imports
import { describe, it, expect } from 'bun:test';

// Project imports
import {
  getManifestSnapshotEntrySchema,
  getManifestSchema
} from '../../../src/schemas/manifest/schema';
import { ENGINE_POSTGRESQL, PSQL_VERSION_15_0 } from '../../../src/constants';

describe('[Unit] - getManifestSnapshotEntrySchema', () => {
  const schema = getManifestSnapshotEntrySchema(ENGINE_POSTGRESQL);

  const validEntry = {
    label: 'v1.0.0',
    'parent-id': null,
    status: 'done' as const,
    'database-version': PSQL_VERSION_15_0,
    'created-at': '2024-01-15T10:30:00Z',
    file: '2024-01-15_v1.0.0.yml',
    'content-hash': 'sha256:' + 'a'.repeat(64),
    'sync-state': 'synced' as const,
    'synced-at': '2024-01-15T10:30:00Z'
  };

  describe('Basic Functionality', () => {
    it('should return a valid schema for postgresql engine', () => {
      expect(schema).toBeDefined();
    });

    it('should accept valid snapshot entry', () => {
      const result = schema.safeParse(validEntry);
      expect(result.success).toBe(true);
    });

    it('should accept entry with parent-id', () => {
      const result = schema.safeParse({
        ...validEntry,
        'parent-id': 'c56a4180-65aa-42ec-a945-5fd21dec0538'
      });
      expect(result.success).toBe(true);
    });

    it('should accept entry with local parent-id', () => {
      const result = schema.safeParse({
        ...validEntry,
        'parent-id': 'local-c56a4180-65aa-42ec-a945-5fd21dec0538'
      });
      expect(result.success).toBe(true);
    });

    it('should accept entry with null synced-at', () => {
      const result = schema.safeParse({
        ...validEntry,
        'synced-at': null
      });
      expect(result.success).toBe(true);
    });

    it('should accept draft status', () => {
      const result = schema.safeParse({
        ...validEntry,
        status: 'draft'
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should reject missing required fields', () => {
      const { label: _, ...entryWithoutLabel } = validEntry;
      const result = schema.safeParse(entryWithoutLabel);
      expect(result.success).toBe(false);
    });

    it('should reject invalid database-version', () => {
      const result = schema.safeParse({
        ...validEntry,
        'database-version': 'v14.0'
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid sync-state', () => {
      const result = schema.safeParse({
        ...validEntry,
        'sync-state': 'pending'
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid content-hash format', () => {
      const result = schema.safeParse({
        ...validEntry,
        'content-hash': 'invalid-hash'
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('[Unit] - getManifestSchema', () => {
  const schema = getManifestSchema(ENGINE_POSTGRESQL);

  const validSnapshotEntry = {
    label: 'v1.0.0',
    'parent-id': null,
    status: 'done' as const,
    'database-version': PSQL_VERSION_15_0,
    'created-at': '2024-01-15T10:30:00Z',
    file: '2024-01-15_v1.0.0.yml',
    'content-hash': 'sha256:' + 'a'.repeat(64),
    'sync-state': 'synced' as const,
    'synced-at': '2024-01-15T10:30:00Z'
  };

  const validManifest = {
    'schema-id': 'c56a4180-65aa-42ec-a945-5fd21dec0538',
    snapshots: {
      'c56a4180-65aa-42ec-a945-5fd21dec0539': validSnapshotEntry
    }
  };

  describe('Basic Functionality', () => {
    it('should return a valid schema for postgresql engine', () => {
      expect(schema).toBeDefined();
    });

    it('should accept valid manifest', () => {
      const result = schema.safeParse(validManifest);
      expect(result.success).toBe(true);
    });

    it('should accept manifest with multiple snapshots', () => {
      const result = schema.safeParse({
        ...validManifest,
        snapshots: {
          'c56a4180-65aa-42ec-a945-5fd21dec0539': validSnapshotEntry,
          'c56a4180-65aa-42ec-a945-5fd21dec053a': {
            ...validSnapshotEntry,
            label: 'v1.1.0',
            'parent-id': 'c56a4180-65aa-42ec-a945-5fd21dec0539'
          }
        }
      });
      expect(result.success).toBe(true);
    });

    it('should accept manifest with local snapshot IDs', () => {
      const result = schema.safeParse({
        ...validManifest,
        snapshots: {
          'local-c56a4180-65aa-42ec-a945-5fd21dec0539': {
            ...validSnapshotEntry,
            'sync-state': 'local-only',
            'synced-at': null
          }
        }
      });
      expect(result.success).toBe(true);
    });

    it('should accept manifest with empty snapshots', () => {
      const result = schema.safeParse({
        ...validManifest,
        snapshots: {}
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should reject missing schema-id', () => {
      const manifestWithoutId = { ...validManifest };
      // @ts-expect-error - intentionally removing required field
      delete manifestWithoutId['schema-id'];
      const result = schema.safeParse(manifestWithoutId);
      expect(result.success).toBe(false);
    });

    it('should reject invalid schema-id format', () => {
      const result = schema.safeParse({
        ...validManifest,
        'schema-id': 'invalid-uuid'
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid snapshot key format', () => {
      const result = schema.safeParse({
        ...validManifest,
        snapshots: {
          'invalid-key': validSnapshotEntry
        }
      });
      expect(result.success).toBe(false);
    });
  });
});
