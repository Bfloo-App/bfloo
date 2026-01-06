// Package imports
import { describe, it, expect } from 'bun:test';

// Project imports
import {
  SchemaSnapshot_IdProp,
  SchemaSnapshot_ParentIdProp,
  SchemaSnapshot_LabelProp,
  SchemaSnapshot_DescriptionProp,
  SchemaSnapshot_StatusProp,
  SchemaSnapshot_CreatedAtProp,
  SchemaSnapshot_UpdatedAtProp,
  SchemaSnapshot_ContentHashProp,
  SchemaSnapshot_BaseProps,
  StoredSnapshot_DescriptionProp,
  getTablesSchema,
  getEngineVersionSchema
} from '../../../src/schemas/schemaSnapshot/props';
import {
  ENGINE_KEY_POSTGRESQL_15_0,
  PSQL_VERSION_15_0
} from '../../../src/constants';

describe('[Unit] - SchemaSnapshot_IdProp', () => {
  describe('Basic Functionality', () => {
    it('should accept valid UUIDv4', () => {
      const result = SchemaSnapshot_IdProp.safeParse(
        'c56a4180-65aa-42ec-a945-5fd21dec0538'
      );
      expect(result.success).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should reject invalid UUID', () => {
      const result = SchemaSnapshot_IdProp.safeParse('invalid');
      expect(result.success).toBe(false);
    });
  });
});

describe('[Unit] - SchemaSnapshot_ParentIdProp', () => {
  describe('Basic Functionality', () => {
    it('should accept valid UUIDv4', () => {
      const result = SchemaSnapshot_ParentIdProp.safeParse(
        'c56a4180-65aa-42ec-a945-5fd21dec0538'
      );
      expect(result.success).toBe(true);
    });

    it('should accept null', () => {
      const result = SchemaSnapshot_ParentIdProp.safeParse(null);
      expect(result.success).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should reject undefined', () => {
      const result = SchemaSnapshot_ParentIdProp.safeParse(undefined);
      expect(result.success).toBe(false);
    });
  });
});

describe('[Unit] - SchemaSnapshot_LabelProp', () => {
  describe('Basic Functionality', () => {
    it('should accept valid labels', () => {
      const validLabels = [
        'v1.0.0',
        '1.2.3-beta.1',
        '1.0.0+build.123',
        'snapshot_2024',
        'feature@test'
      ];
      for (const label of validLabels) {
        const result = SchemaSnapshot_LabelProp.safeParse(label);
        expect(result.success).toBe(true);
      }
    });

    it('should trim whitespace', () => {
      const result = SchemaSnapshot_LabelProp.safeParse('  v1.0.0  ');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('v1.0.0');
      }
    });
  });

  describe('Edge Cases', () => {
    it('should reject empty string', () => {
      const result = SchemaSnapshot_LabelProp.safeParse('');
      expect(result.success).toBe(false);
    });

    it('should reject labels longer than 64 characters', () => {
      const result = SchemaSnapshot_LabelProp.safeParse('a'.repeat(65));
      expect(result.success).toBe(false);
    });

    it('should reject labels with spaces', () => {
      const result = SchemaSnapshot_LabelProp.safeParse('v1 0 0');
      expect(result.success).toBe(false);
    });

    it('should reject labels with special characters not in pattern', () => {
      const result = SchemaSnapshot_LabelProp.safeParse('v1.0.0!');
      expect(result.success).toBe(false);
    });
  });
});

describe('[Unit] - SchemaSnapshot_DescriptionProp', () => {
  describe('Basic Functionality', () => {
    it('should accept valid description', () => {
      const result = SchemaSnapshot_DescriptionProp.safeParse('A description');
      expect(result.success).toBe(true);
    });

    it('should accept null', () => {
      const result = SchemaSnapshot_DescriptionProp.safeParse(null);
      expect(result.success).toBe(true);
    });

    it('should trim whitespace', () => {
      const result = SchemaSnapshot_DescriptionProp.safeParse('  trimmed  ');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('trimmed');
      }
    });
  });

  describe('Edge Cases', () => {
    it('should reject descriptions longer than 256 characters', () => {
      const result = SchemaSnapshot_DescriptionProp.safeParse('a'.repeat(257));
      expect(result.success).toBe(false);
    });
  });
});

describe('[Unit] - SchemaSnapshot_StatusProp', () => {
  describe('Basic Functionality', () => {
    it('should accept draft status', () => {
      const result = SchemaSnapshot_StatusProp.safeParse('draft');
      expect(result.success).toBe(true);
    });

    it('should accept done status', () => {
      const result = SchemaSnapshot_StatusProp.safeParse('done');
      expect(result.success).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should reject invalid status', () => {
      const result = SchemaSnapshot_StatusProp.safeParse('pending');
      expect(result.success).toBe(false);
    });
  });
});

describe('[Unit] - SchemaSnapshot_CreatedAtProp', () => {
  describe('Basic Functionality', () => {
    it('should coerce ISO date string', () => {
      const result = SchemaSnapshot_CreatedAtProp.safeParse(
        '2024-01-15T10:30:00Z'
      );
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeInstanceOf(Date);
      }
    });

    it('should accept Date object', () => {
      const result = SchemaSnapshot_CreatedAtProp.safeParse(new Date());
      expect(result.success).toBe(true);
    });
  });
});

describe('[Unit] - SchemaSnapshot_UpdatedAtProp', () => {
  describe('Basic Functionality', () => {
    it('should coerce ISO date string', () => {
      const result = SchemaSnapshot_UpdatedAtProp.safeParse(
        '2024-01-15T10:30:00Z'
      );
      expect(result.success).toBe(true);
    });
  });
});

describe('[Unit] - SchemaSnapshot_ContentHashProp', () => {
  describe('Basic Functionality', () => {
    it('should accept valid SHA-256 hash', () => {
      const hash = 'sha256:' + 'a'.repeat(64);
      const result = SchemaSnapshot_ContentHashProp.safeParse(hash);
      expect(result.success).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should reject hash without sha256 prefix', () => {
      const result = SchemaSnapshot_ContentHashProp.safeParse('a'.repeat(64));
      expect(result.success).toBe(false);
    });

    it('should reject hash with wrong length', () => {
      const result = SchemaSnapshot_ContentHashProp.safeParse(
        'sha256:' + 'a'.repeat(63)
      );
      expect(result.success).toBe(false);
    });

    it('should reject hash with uppercase hex', () => {
      const result = SchemaSnapshot_ContentHashProp.safeParse(
        'sha256:' + 'A'.repeat(64)
      );
      expect(result.success).toBe(false);
    });

    it('should reject hash with non-hex characters', () => {
      const result = SchemaSnapshot_ContentHashProp.safeParse(
        'sha256:' + 'g'.repeat(64)
      );
      expect(result.success).toBe(false);
    });
  });
});

describe('[Unit] - SchemaSnapshot_BaseProps', () => {
  describe('Basic Functionality', () => {
    it('should have all required base properties defined', () => {
      expect(SchemaSnapshot_BaseProps.id).toBeDefined();
      expect(SchemaSnapshot_BaseProps.schemaId).toBeDefined();
      expect(SchemaSnapshot_BaseProps.parentId).toBeDefined();
      expect(SchemaSnapshot_BaseProps.label).toBeDefined();
      expect(SchemaSnapshot_BaseProps.description).toBeDefined();
      expect(SchemaSnapshot_BaseProps.status).toBeDefined();
      expect(SchemaSnapshot_BaseProps.contentHash).toBeDefined();
      expect(SchemaSnapshot_BaseProps.createdAt).toBeDefined();
      expect(SchemaSnapshot_BaseProps.updatedAt).toBeDefined();
    });
  });
});

describe('[Unit] - StoredSnapshot_DescriptionProp', () => {
  describe('Basic Functionality', () => {
    it('should accept valid description', () => {
      const result = StoredSnapshot_DescriptionProp.safeParse('A description');
      expect(result.success).toBe(true);
    });

    it('should accept undefined', () => {
      const result = StoredSnapshot_DescriptionProp.safeParse(undefined);
      expect(result.success).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should reject descriptions longer than 256 characters', () => {
      const result = StoredSnapshot_DescriptionProp.safeParse('a'.repeat(257));
      expect(result.success).toBe(false);
    });
  });
});

describe('[Unit] - getTablesSchema', () => {
  describe('Basic Functionality', () => {
    it('should return schema for postgresql:v15.0', () => {
      const schema = getTablesSchema(ENGINE_KEY_POSTGRESQL_15_0);
      expect(schema).toBeDefined();
    });

    it('should validate PostgreSQL tables array', () => {
      const schema = getTablesSchema(ENGINE_KEY_POSTGRESQL_15_0);
      const result = schema.safeParse([
        {
          id: 1,
          name: 'users',
          columns: [
            {
              id: 1,
              name: 'id',
              type: 'serial',
              constraints: { nullable: false }
            }
          ]
        }
      ]);
      expect(result.success).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should throw CliError for unsupported engine key', () => {
      expect(() =>
        getTablesSchema('mysql:v8.0' as typeof ENGINE_KEY_POSTGRESQL_15_0)
      ).toThrow('is not supported');
    });
  });
});

describe('[Unit] - getEngineVersionSchema', () => {
  describe('Basic Functionality', () => {
    it('should return literal schema for postgresql:v15.0', () => {
      const schema = getEngineVersionSchema(ENGINE_KEY_POSTGRESQL_15_0);
      const result = schema.safeParse(PSQL_VERSION_15_0);
      expect(result.success).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should reject wrong version', () => {
      const schema = getEngineVersionSchema(ENGINE_KEY_POSTGRESQL_15_0);
      const result = schema.safeParse('v14.0');
      expect(result.success).toBe(false);
    });

    it('should throw CliError for unsupported engine key', () => {
      expect(() =>
        getEngineVersionSchema(
          'mysql:v8.0' as typeof ENGINE_KEY_POSTGRESQL_15_0
        )
      ).toThrow('is not supported');
    });
  });
});
