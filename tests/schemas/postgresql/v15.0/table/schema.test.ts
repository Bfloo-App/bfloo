// Package imports
import { describe, it, expect } from 'bun:test';

// Project imports
import { Psql15_0_TableSchema } from '../../../../../src/schemas/postgresql/v15.0/table/schema';

describe('[Unit] - Psql15_0_TableSchema', () => {
  const validColumn = {
    id: 1,
    name: 'id',
    type: 'serial' as const,
    constraints: { nullable: false }
  };

  const validTable = {
    id: 1,
    name: 'users',
    columns: [validColumn]
  };

  describe('Basic Functionality', () => {
    it('should accept valid table with single column', () => {
      const result = Psql15_0_TableSchema.safeParse(validTable);
      expect(result.success).toBe(true);
    });

    it('should accept table with multiple columns', () => {
      const result = Psql15_0_TableSchema.safeParse({
        ...validTable,
        columns: [
          validColumn,
          { id: 2, name: 'email', type: 'text' as const },
          { id: 3, name: 'created_at', type: 'timestamp' as const }
        ]
      });
      expect(result.success).toBe(true);
    });

    it('should accept table with description', () => {
      const result = Psql15_0_TableSchema.safeParse({
        ...validTable,
        description: 'Table for storing user data'
      });
      expect(result.success).toBe(true);
    });

    it('should accept table with constraints', () => {
      const result = Psql15_0_TableSchema.safeParse({
        ...validTable,
        constraints: [
          {
            id: 1,
            name: 'pk_users',
            type: 'primary_key' as const,
            columns: ['id']
          }
        ]
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Column Uniqueness Validation', () => {
    it('should reject duplicate column IDs', () => {
      const result = Psql15_0_TableSchema.safeParse({
        ...validTable,
        columns: [
          { id: 1, name: 'col1', type: 'text' as const },
          { id: 1, name: 'col2', type: 'text' as const }
        ]
      });
      expect(result.success).toBe(false);
    });

    it('should reject duplicate column names', () => {
      const result = Psql15_0_TableSchema.safeParse({
        ...validTable,
        columns: [
          { id: 1, name: 'duplicate', type: 'text' as const },
          { id: 2, name: 'duplicate', type: 'integer' as const }
        ]
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Constraint Uniqueness Validation', () => {
    it('should reject duplicate constraint IDs', () => {
      const result = Psql15_0_TableSchema.safeParse({
        ...validTable,
        constraints: [
          {
            id: 1,
            name: 'pk_users',
            type: 'primary_key' as const,
            columns: ['id']
          },
          {
            id: 1,
            name: 'unique_email',
            type: 'unique' as const,
            columns: ['id']
          }
        ]
      });
      expect(result.success).toBe(false);
    });

    it('should reject duplicate constraint names', () => {
      const result = Psql15_0_TableSchema.safeParse({
        ...validTable,
        constraints: [
          {
            id: 1,
            name: 'same_name',
            type: 'primary_key' as const,
            columns: ['id']
          },
          {
            id: 2,
            name: 'same_name',
            type: 'unique' as const,
            columns: ['id']
          }
        ]
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Constraint Column Reference Validation', () => {
    it('should reject constraint referencing non-existent column', () => {
      const result = Psql15_0_TableSchema.safeParse({
        ...validTable,
        constraints: [
          {
            id: 1,
            name: 'pk_users',
            type: 'primary_key' as const,
            columns: ['non_existent']
          }
        ]
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Primary Key Validation', () => {
    it('should reject multiple primary key constraints', () => {
      const result = Psql15_0_TableSchema.safeParse({
        id: 1,
        name: 'test_table',
        columns: [
          {
            id: 1,
            name: 'id',
            type: 'serial' as const,
            constraints: { nullable: false }
          },
          {
            id: 2,
            name: 'uuid',
            type: 'text' as const,
            constraints: { nullable: false }
          }
        ],
        constraints: [
          {
            id: 1,
            name: 'pk_id',
            type: 'primary_key' as const,
            columns: ['id']
          },
          {
            id: 2,
            name: 'pk_uuid',
            type: 'primary_key' as const,
            columns: ['uuid']
          }
        ]
      });
      expect(result.success).toBe(false);
    });

    it('should reject primary key column without nullable=false', () => {
      const result = Psql15_0_TableSchema.safeParse({
        id: 1,
        name: 'test_table',
        columns: [{ id: 1, name: 'id', type: 'serial' as const }],
        constraints: [
          {
            id: 1,
            name: 'pk_test',
            type: 'primary_key' as const,
            columns: ['id']
          }
        ]
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Foreign Key Validation', () => {
    it('should reject FK with mismatched column count', () => {
      const result = Psql15_0_TableSchema.safeParse({
        id: 1,
        name: 'orders',
        columns: [
          {
            id: 1,
            name: 'id',
            type: 'serial' as const,
            constraints: { nullable: false }
          },
          { id: 2, name: 'user_id', type: 'integer' as const }
        ],
        constraints: [
          {
            id: 1,
            name: 'fk_orders_user',
            type: 'foreign_key' as const,
            columns: ['user_id'],
            references: {
              table: 'users',
              columns: ['id', 'email']
            },
            on_delete: 'cascade' as const,
            on_update: 'cascade' as const
          }
        ]
      });
      expect(result.success).toBe(false);
    });

    it('should reject FK with set_null on non-nullable column', () => {
      const result = Psql15_0_TableSchema.safeParse({
        id: 1,
        name: 'orders',
        columns: [
          {
            id: 1,
            name: 'id',
            type: 'serial' as const,
            constraints: { nullable: false }
          },
          {
            id: 2,
            name: 'user_id',
            type: 'integer' as const,
            constraints: { nullable: false }
          }
        ],
        constraints: [
          {
            id: 1,
            name: 'fk_orders_user',
            type: 'foreign_key' as const,
            columns: ['user_id'],
            references: {
              table: 'users',
              columns: ['id']
            },
            on_delete: 'set_null' as const,
            on_update: 'cascade' as const
          }
        ]
      });
      expect(result.success).toBe(false);
    });

    it('should accept FK with set_null on nullable column', () => {
      const result = Psql15_0_TableSchema.safeParse({
        id: 1,
        name: 'orders',
        columns: [
          {
            id: 1,
            name: 'id',
            type: 'serial' as const,
            constraints: { nullable: false }
          },
          {
            id: 2,
            name: 'user_id',
            type: 'integer' as const,
            constraints: { nullable: true }
          }
        ],
        constraints: [
          {
            id: 1,
            name: 'fk_orders_user',
            type: 'foreign_key' as const,
            columns: ['user_id'],
            references: {
              table: 'users',
              columns: ['id']
            },
            on_delete: 'set_null' as const,
            on_update: 'cascade' as const
          }
        ]
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should reject missing required fields', () => {
      const result = Psql15_0_TableSchema.safeParse({ id: 1 });
      expect(result.success).toBe(false);
    });

    it('should reject table with empty columns array', () => {
      const result = Psql15_0_TableSchema.safeParse({
        id: 1,
        name: 'empty_table',
        columns: []
      });
      expect(result.success).toBe(false);
    });

    it('should reject extra fields (strict mode)', () => {
      const result = Psql15_0_TableSchema.safeParse({
        ...validTable,
        extra: 'field'
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid table name', () => {
      const result = Psql15_0_TableSchema.safeParse({
        ...validTable,
        name: 'Invalid Table'
      });
      expect(result.success).toBe(false);
    });
  });
});
