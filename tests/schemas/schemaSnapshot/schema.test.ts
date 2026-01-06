// Package imports
import { describe, it, expect } from 'bun:test';

// Project imports
import { SchemaSnapshot_Schema } from '../../../src/schemas/schemaSnapshot/schema';
import {
  ENGINE_POSTGRESQL,
  PSQL_VERSION_15_0,
  ENGINE_KEY_POSTGRESQL_15_0
} from '../../../src/constants';

describe('[Unit] - SchemaSnapshot_Schema', () => {
  const validSnapshot = {
    id: 'c56a4180-65aa-42ec-a945-5fd21dec0538',
    schemaId: 'c56a4180-65aa-42ec-a945-5fd21dec0539',
    parentId: null,
    label: 'v1.0.0',
    description: 'Initial schema',
    engine: ENGINE_POSTGRESQL,
    engineVersion: PSQL_VERSION_15_0,
    engineKey: ENGINE_KEY_POSTGRESQL_15_0,
    status: 'done' as const,
    contentHash: 'sha256:' + 'a'.repeat(64),
    data: {
      tables: [
        {
          id: 1,
          name: 'users',
          columns: [
            {
              id: 1,
              name: 'id',
              type: 'serial' as const,
              constraints: { nullable: false }
            }
          ],
          constraints: [
            {
              id: 1,
              name: 'pk_users',
              type: 'primary_key' as const,
              columns: ['id']
            }
          ]
        }
      ]
    },
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  };

  describe('Basic Functionality', () => {
    it('should accept valid postgresql v15.0 snapshot', () => {
      const result = SchemaSnapshot_Schema.safeParse(validSnapshot);
      expect(result.success).toBe(true);
    });

    it('should accept snapshot with null data', () => {
      const result = SchemaSnapshot_Schema.safeParse({
        ...validSnapshot,
        data: null
      });
      expect(result.success).toBe(true);
    });

    it('should accept snapshot with parentId', () => {
      const result = SchemaSnapshot_Schema.safeParse({
        ...validSnapshot,
        parentId: 'c56a4180-65aa-42ec-a945-5fd21dec053a'
      });
      expect(result.success).toBe(true);
    });

    it('should accept snapshot with null description', () => {
      const result = SchemaSnapshot_Schema.safeParse({
        ...validSnapshot,
        description: null
      });
      expect(result.success).toBe(true);
    });

    it('should accept draft status', () => {
      const result = SchemaSnapshot_Schema.safeParse({
        ...validSnapshot,
        status: 'draft'
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Discriminated Union Validation', () => {
    it('should reject mismatched engine and engineKey', () => {
      const result = SchemaSnapshot_Schema.safeParse({
        ...validSnapshot,
        engine: 'mysql',
        engineKey: 'mysql:v8.0'
      });
      expect(result.success).toBe(false);
    });

    it('should reject mismatched engineVersion and engineKey', () => {
      const result = SchemaSnapshot_Schema.safeParse({
        ...validSnapshot,
        engineVersion: 'v16.0',
        engineKey: 'postgresql:v16.0'
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should reject missing required fields', () => {
      const { id: _, ...snapshotWithoutId } = validSnapshot;
      const result = SchemaSnapshot_Schema.safeParse(snapshotWithoutId);
      expect(result.success).toBe(false);
    });

    it('should reject invalid UUID for id', () => {
      const result = SchemaSnapshot_Schema.safeParse({
        ...validSnapshot,
        id: 'invalid-uuid'
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid status', () => {
      const result = SchemaSnapshot_Schema.safeParse({
        ...validSnapshot,
        status: 'pending'
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid content hash', () => {
      const result = SchemaSnapshot_Schema.safeParse({
        ...validSnapshot,
        contentHash: 'invalid-hash'
      });
      expect(result.success).toBe(false);
    });
  });
});
