// Package imports
import { describe, it, expect } from 'bun:test';

// Project imports
import {
  getWorkingSnapshotSchema,
  WorkingSnapshot_SchemaNameProp,
  WorkingSnapshot_SchemaDescriptionProp
} from '../../../src/schemas/schemaSnapshot/working';
import {
  ENGINE_KEY_POSTGRESQL_15_0,
  PSQL_VERSION_15_0
} from '../../../src/constants';

describe('[Unit] - WorkingSnapshot_SchemaNameProp', () => {
  describe('Basic Functionality', () => {
    it('should accept valid schema names', () => {
      const validNames = ['My Schema', 'Test DB', 'production-schema'];
      for (const name of validNames) {
        const result = WorkingSnapshot_SchemaNameProp.safeParse(name);
        expect(result.success).toBe(true);
      }
    });

    it('should trim whitespace', () => {
      const result = WorkingSnapshot_SchemaNameProp.safeParse('  Schema  ');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('Schema');
      }
    });
  });

  describe('Edge Cases', () => {
    it('should reject empty string', () => {
      const result = WorkingSnapshot_SchemaNameProp.safeParse('');
      expect(result.success).toBe(false);
    });

    it('should reject names longer than 64 characters', () => {
      const result = WorkingSnapshot_SchemaNameProp.safeParse('a'.repeat(65));
      expect(result.success).toBe(false);
    });
  });
});

describe('[Unit] - WorkingSnapshot_SchemaDescriptionProp', () => {
  describe('Basic Functionality', () => {
    it('should accept valid description', () => {
      const result =
        WorkingSnapshot_SchemaDescriptionProp.safeParse('A description');
      expect(result.success).toBe(true);
    });

    it('should accept undefined', () => {
      const result = WorkingSnapshot_SchemaDescriptionProp.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it('should trim whitespace', () => {
      const result =
        WorkingSnapshot_SchemaDescriptionProp.safeParse('  trimmed  ');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('trimmed');
      }
    });
  });

  describe('Edge Cases', () => {
    it('should reject descriptions longer than 256 characters', () => {
      const result = WorkingSnapshot_SchemaDescriptionProp.safeParse(
        'a'.repeat(257)
      );
      expect(result.success).toBe(false);
    });
  });
});

describe('[Unit] - getWorkingSnapshotSchema', () => {
  const schema = getWorkingSnapshotSchema(ENGINE_KEY_POSTGRESQL_15_0);

  const validWorkingSnapshot = {
    schema: {
      name: 'My Database'
    }
  };

  const validWorkingSnapshotWithData = {
    schema: {
      name: 'My Database',
      description: 'Test database'
    },
    snapshot: {
      label: 'v1.0.0',
      'engine-version': PSQL_VERSION_15_0,
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
    }
  };

  describe('Basic Functionality', () => {
    it('should return a valid schema for postgresql:v15.0', () => {
      expect(schema).toBeDefined();
    });

    it('should accept minimal working snapshot (schema only)', () => {
      const result = schema.safeParse(validWorkingSnapshot);
      expect(result.success).toBe(true);
    });

    it('should accept working snapshot with snapshot data', () => {
      const result = schema.safeParse(validWorkingSnapshotWithData);
      expect(result.success).toBe(true);
    });

    it('should accept working snapshot with schema description', () => {
      const result = schema.safeParse({
        schema: {
          name: 'My Database',
          description: 'A test database'
        }
      });
      expect(result.success).toBe(true);
    });

    it('should accept working snapshot with snapshot description', () => {
      const result = schema.safeParse({
        ...validWorkingSnapshotWithData,
        snapshot: {
          ...validWorkingSnapshotWithData.snapshot,
          description: 'Initial release'
        }
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Schema Section Validation', () => {
    it('should reject missing schema section', () => {
      const result = schema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should reject missing schema name', () => {
      const result = schema.safeParse({
        schema: {}
      });
      expect(result.success).toBe(false);
    });

    it('should reject extra fields in schema section (strict)', () => {
      const result = schema.safeParse({
        schema: {
          name: 'My Database',
          extra: 'field'
        }
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Snapshot Section Validation', () => {
    it('should reject snapshot without label', () => {
      const result = schema.safeParse({
        schema: { name: 'My Database' },
        snapshot: {
          'engine-version': PSQL_VERSION_15_0,
          tables: []
        }
      });
      expect(result.success).toBe(false);
    });

    it('should reject snapshot without engine-version', () => {
      const result = schema.safeParse({
        schema: { name: 'My Database' },
        snapshot: {
          label: 'v1.0.0',
          tables: []
        }
      });
      expect(result.success).toBe(false);
    });

    it('should reject snapshot with wrong engine-version', () => {
      const result = schema.safeParse({
        schema: { name: 'My Database' },
        snapshot: {
          label: 'v1.0.0',
          'engine-version': 'v14.0',
          tables: []
        }
      });
      expect(result.success).toBe(false);
    });

    it('should reject snapshot without tables', () => {
      const result = schema.safeParse({
        schema: { name: 'My Database' },
        snapshot: {
          label: 'v1.0.0',
          'engine-version': PSQL_VERSION_15_0
        }
      });
      expect(result.success).toBe(false);
    });

    it('should accept snapshot with empty tables array', () => {
      const result = schema.safeParse({
        schema: { name: 'My Database' },
        snapshot: {
          label: 'v1.0.0',
          'engine-version': PSQL_VERSION_15_0,
          tables: []
        }
      });
      expect(result.success).toBe(true);
    });

    it('should reject extra fields in snapshot section (strict)', () => {
      const result = schema.safeParse({
        schema: { name: 'My Database' },
        snapshot: {
          label: 'v1.0.0',
          'engine-version': PSQL_VERSION_15_0,
          tables: [],
          extra: 'field'
        }
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should reject extra fields at root level (strict)', () => {
      const result = schema.safeParse({
        ...validWorkingSnapshot,
        extra: 'field'
      });
      expect(result.success).toBe(false);
    });

    it('should reject non-object values', () => {
      const result = schema.safeParse('invalid');
      expect(result.success).toBe(false);
    });
  });
});
