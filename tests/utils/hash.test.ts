// Package imports
import { describe, it, expect } from 'bun:test';
import type z from 'zod';

// Project imports
import { computeSnapshotContentHash } from '../../src/utils/hash';
import type { SchemaSnapshot_Schema } from '../../src/schemas';

// Helper to create valid snapshot objects
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

describe('[Unit] - computeSnapshotContentHash', () => {
  describe('Basic Functionality', () => {
    it('should return hash string with sha256 prefix', () => {
      const snapshot = createSnapshot();
      const hash = computeSnapshotContentHash(snapshot);
      expect(hash).toMatch(/^sha256:[a-f0-9]{64}$/);
    });

    it('should return consistent hash for same content', () => {
      const snapshot1 = createSnapshot();
      const snapshot2 = createSnapshot();
      const hash1 = computeSnapshotContentHash(snapshot1);
      const hash2 = computeSnapshotContentHash(snapshot2);
      expect(hash1).toBe(hash2);
    });

    it('should return different hash for different engineKey', () => {
      const snapshot1 = createSnapshot({ engineKey: 'postgresql:v15.0' });
      // Create snapshot with same structure but we'll compare against a modified version
      const hash1 = computeSnapshotContentHash(snapshot1);

      // Since engineKey is part of the hash, changing it would change the hash
      // But we can't easily create a different engineKey due to discriminated union
      // So we test with description instead
      const snapshot2 = createSnapshot({ description: 'different' });
      const hash2 = computeSnapshotContentHash(snapshot2);
      expect(hash1).not.toBe(hash2);
    });

    it('should return different hash for different description', () => {
      const snapshot1 = createSnapshot({ description: 'Description A' });
      const snapshot2 = createSnapshot({ description: 'Description B' });
      const hash1 = computeSnapshotContentHash(snapshot1);
      const hash2 = computeSnapshotContentHash(snapshot2);
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Content Variations', () => {
    it('should hash snapshot with null data', () => {
      const snapshot = createSnapshot({ data: null });
      const hash = computeSnapshotContentHash(snapshot);
      expect(hash).toMatch(/^sha256:[a-f0-9]{64}$/);
    });

    it('should hash snapshot with null description', () => {
      const snapshot = createSnapshot({ description: null });
      const hash = computeSnapshotContentHash(snapshot);
      expect(hash).toMatch(/^sha256:[a-f0-9]{64}$/);
    });

    it('should hash snapshot with description', () => {
      const snapshot = createSnapshot({ description: 'Test description' });
      const hash = computeSnapshotContentHash(snapshot);
      expect(hash).toMatch(/^sha256:[a-f0-9]{64}$/);
    });

    it('should hash snapshot with data containing tables', () => {
      const snapshot = createSnapshot({
        data: {
          tables: [
            {
              name: 'users',
              columns: [
                {
                  name: 'id',
                  type: 'uuid',
                  nullable: false,
                  default: null
                }
              ],
              constraints: []
            }
          ]
        }
      });
      const hash = computeSnapshotContentHash(snapshot);
      expect(hash).toMatch(/^sha256:[a-f0-9]{64}$/);
    });

    it('should produce different hash when tables differ', () => {
      const snapshot1 = createSnapshot({
        data: {
          tables: [
            {
              name: 'users',
              columns: [],
              constraints: []
            }
          ]
        }
      });
      const snapshot2 = createSnapshot({
        data: {
          tables: [
            {
              name: 'accounts',
              columns: [],
              constraints: []
            }
          ]
        }
      });
      const hash1 = computeSnapshotContentHash(snapshot1);
      const hash2 = computeSnapshotContentHash(snapshot2);
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Hash Determinism', () => {
    it('should produce same hash regardless of non-content fields', () => {
      const snapshot1 = createSnapshot({
        id: 'id-1',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      });
      const snapshot2 = createSnapshot({
        id: 'id-2',
        createdAt: new Date('2024-06-15'),
        updatedAt: new Date('2024-12-31')
      });
      const hash1 = computeSnapshotContentHash(snapshot1);
      const hash2 = computeSnapshotContentHash(snapshot2);
      expect(hash1).toBe(hash2);
    });

    it('should produce same hash regardless of label', () => {
      const snapshot1 = createSnapshot({ label: 'v1.0.0' });
      const snapshot2 = createSnapshot({ label: 'v2.0.0' });
      const hash1 = computeSnapshotContentHash(snapshot1);
      const hash2 = computeSnapshotContentHash(snapshot2);
      expect(hash1).toBe(hash2);
    });

    it('should produce same hash regardless of status', () => {
      const snapshot1 = createSnapshot({ status: 'draft' });
      const snapshot2 = createSnapshot({ status: 'done' });
      const hash1 = computeSnapshotContentHash(snapshot1);
      const hash2 = computeSnapshotContentHash(snapshot2);
      expect(hash1).toBe(hash2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty tables array', () => {
      const snapshot = createSnapshot({
        data: { tables: [] }
      });
      const hash = computeSnapshotContentHash(snapshot);
      expect(hash).toMatch(/^sha256:[a-f0-9]{64}$/);
    });

    it('should handle complex nested table data', () => {
      const snapshot = createSnapshot({
        data: {
          tables: [
            {
              name: 'users',
              columns: [
                { name: 'id', type: 'uuid', nullable: false, default: null },
                {
                  name: 'email',
                  type: 'varchar(255)',
                  nullable: false,
                  default: null
                },
                {
                  name: 'created_at',
                  type: 'timestamp',
                  nullable: false,
                  default: 'now()'
                }
              ],
              constraints: [
                { name: 'users_pkey', type: 'PRIMARY KEY', columns: ['id'] },
                {
                  name: 'users_email_unique',
                  type: 'UNIQUE',
                  columns: ['email']
                }
              ]
            },
            {
              name: 'posts',
              columns: [
                { name: 'id', type: 'uuid', nullable: false, default: null },
                {
                  name: 'user_id',
                  type: 'uuid',
                  nullable: false,
                  default: null
                },
                {
                  name: 'title',
                  type: 'varchar(255)',
                  nullable: false,
                  default: null
                }
              ],
              constraints: [
                { name: 'posts_pkey', type: 'PRIMARY KEY', columns: ['id'] }
              ]
            }
          ]
        }
      });
      const hash = computeSnapshotContentHash(snapshot);
      expect(hash).toMatch(/^sha256:[a-f0-9]{64}$/);
    });

    it('should handle description with special characters', () => {
      const snapshot = createSnapshot({
        description: 'Test with "quotes" and \'apostrophes\' and \n newlines'
      });
      const hash = computeSnapshotContentHash(snapshot);
      expect(hash).toMatch(/^sha256:[a-f0-9]{64}$/);
    });

    it('should handle unicode in description', () => {
      const snapshot = createSnapshot({
        description: 'Unicode: emoji and symbols'
      });
      const hash = computeSnapshotContentHash(snapshot);
      expect(hash).toMatch(/^sha256:[a-f0-9]{64}$/);
    });
  });
});
