// Package imports
import { describe, it, expect } from 'bun:test';

// Project imports
import { getStoredSnapshotSchema } from '../../../src/schemas/schemaSnapshot/stored';
import { ENGINE_KEY_POSTGRESQL_15_0 } from '../../../src/constants';

describe('[Unit] - getStoredSnapshotSchema', () => {
  const schema = getStoredSnapshotSchema(ENGINE_KEY_POSTGRESQL_15_0);

  const validStoredSnapshot = {
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
          },
          {
            id: 2,
            name: 'email',
            type: 'text' as const
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
  };

  describe('Basic Functionality', () => {
    it('should return a valid schema for postgresql:v15.0', () => {
      expect(schema).toBeDefined();
    });

    it('should accept valid stored snapshot', () => {
      const result = schema.safeParse(validStoredSnapshot);
      expect(result.success).toBe(true);
    });

    it('should accept stored snapshot with description', () => {
      const result = schema.safeParse({
        ...validStoredSnapshot,
        description: 'Snapshot description'
      });
      expect(result.success).toBe(true);
    });

    it('should accept stored snapshot without description', () => {
      const result = schema.safeParse(validStoredSnapshot);
      expect(result.success).toBe(true);
    });

    it('should accept stored snapshot with empty tables', () => {
      const result = schema.safeParse({
        tables: []
      });
      expect(result.success).toBe(true);
    });

    it('should accept stored snapshot with multiple tables', () => {
      const result = schema.safeParse({
        tables: [
          validStoredSnapshot.tables[0],
          {
            id: 2,
            name: 'orders',
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
                name: 'pk_orders',
                type: 'primary_key' as const,
                columns: ['id']
              }
            ]
          }
        ]
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should reject missing tables field', () => {
      const result = schema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should reject extra fields (strict mode)', () => {
      const result = schema.safeParse({
        ...validStoredSnapshot,
        extra: 'field'
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid table structure', () => {
      const result = schema.safeParse({
        tables: [{ invalid: 'table' }]
      });
      expect(result.success).toBe(false);
    });

    it('should reject description longer than 256 characters', () => {
      const result = schema.safeParse({
        ...validStoredSnapshot,
        description: 'a'.repeat(257)
      });
      expect(result.success).toBe(false);
    });
  });
});
