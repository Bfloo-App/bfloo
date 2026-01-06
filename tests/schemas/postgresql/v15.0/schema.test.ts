// Package imports
import { describe, it, expect } from 'bun:test';

// Project imports
import { Psql15_0_Schema } from '../../../../src/schemas/postgresql/v15.0/schema';

describe('[Unit] - Psql15_0_Schema', () => {
  const validColumn = {
    id: 1,
    name: 'id',
    type: 'serial' as const,
    constraints: { nullable: false }
  };

  const validTable = {
    id: 1,
    name: 'users',
    columns: [
      validColumn,
      {
        id: 2,
        name: 'email',
        type: 'text' as const,
        constraints: { nullable: false }
      }
    ],
    constraints: [
      {
        id: 1,
        name: 'pk_users',
        type: 'primary_key' as const,
        columns: ['id']
      },
      {
        id: 2,
        name: 'unique_email',
        type: 'unique' as const,
        columns: ['email']
      }
    ]
  };

  const validSchema = {
    tables: [validTable]
  };

  describe('Basic Functionality', () => {
    it('should accept valid schema with single table', () => {
      const result = Psql15_0_Schema.safeParse(validSchema);
      expect(result.success).toBe(true);
    });

    it('should accept schema with multiple tables', () => {
      const result = Psql15_0_Schema.safeParse({
        tables: [
          validTable,
          {
            id: 2,
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

    it('should accept schema with empty tables array', () => {
      const result = Psql15_0_Schema.safeParse({ tables: [] });
      expect(result.success).toBe(true);
    });
  });

  describe('Table Uniqueness Validation', () => {
    it('should reject duplicate table IDs', () => {
      const result = Psql15_0_Schema.safeParse({
        tables: [
          { ...validTable, id: 1 },
          {
            id: 1,
            name: 'orders',
            columns: [
              {
                id: 1,
                name: 'id',
                type: 'serial' as const,
                constraints: { nullable: false }
              }
            ]
          }
        ]
      });
      expect(result.success).toBe(false);
    });

    it('should reject duplicate table names', () => {
      const result = Psql15_0_Schema.safeParse({
        tables: [
          validTable,
          {
            id: 2,
            name: 'users',
            columns: [
              {
                id: 1,
                name: 'id',
                type: 'serial' as const,
                constraints: { nullable: false }
              }
            ]
          }
        ]
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Foreign Key Cross-Table Validation', () => {
    it('should accept valid foreign key reference', () => {
      const result = Psql15_0_Schema.safeParse({
        tables: [
          validTable,
          {
            id: 2,
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
                name: 'pk_orders',
                type: 'primary_key' as const,
                columns: ['id']
              },
              {
                id: 2,
                name: 'fk_orders_user',
                type: 'foreign_key' as const,
                columns: ['user_id'],
                references: {
                  table: 'users',
                  columns: ['id']
                },
                on_delete: 'cascade' as const,
                on_update: 'cascade' as const
              }
            ]
          }
        ]
      });
      expect(result.success).toBe(true);
    });

    it('should reject FK referencing non-existent table', () => {
      const result = Psql15_0_Schema.safeParse({
        tables: [
          {
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
                name: 'pk_orders',
                type: 'primary_key' as const,
                columns: ['id']
              },
              {
                id: 2,
                name: 'fk_orders_user',
                type: 'foreign_key' as const,
                columns: ['user_id'],
                references: {
                  table: 'non_existent',
                  columns: ['id']
                },
                on_delete: 'cascade' as const,
                on_update: 'cascade' as const
              }
            ]
          }
        ]
      });
      expect(result.success).toBe(false);
    });

    it('should reject FK referencing non-existent column', () => {
      const result = Psql15_0_Schema.safeParse({
        tables: [
          validTable,
          {
            id: 2,
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
                name: 'pk_orders',
                type: 'primary_key' as const,
                columns: ['id']
              },
              {
                id: 2,
                name: 'fk_orders_user',
                type: 'foreign_key' as const,
                columns: ['user_id'],
                references: {
                  table: 'users',
                  columns: ['non_existent_column']
                },
                on_delete: 'cascade' as const,
                on_update: 'cascade' as const
              }
            ]
          }
        ]
      });
      expect(result.success).toBe(false);
    });

    it('should reject FK referencing columns without PK/unique constraint', () => {
      const result = Psql15_0_Schema.safeParse({
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
              { id: 2, name: 'name', type: 'text' as const }
            ],
            constraints: [
              {
                id: 1,
                name: 'pk_users',
                type: 'primary_key' as const,
                columns: ['id']
              }
            ]
          },
          {
            id: 2,
            name: 'orders',
            columns: [
              {
                id: 1,
                name: 'id',
                type: 'serial' as const,
                constraints: { nullable: false }
              },
              { id: 2, name: 'user_name', type: 'text' as const }
            ],
            constraints: [
              {
                id: 1,
                name: 'pk_orders',
                type: 'primary_key' as const,
                columns: ['id']
              },
              {
                id: 2,
                name: 'fk_orders_user',
                type: 'foreign_key' as const,
                columns: ['user_name'],
                references: {
                  table: 'users',
                  columns: ['name']
                },
                on_delete: 'cascade' as const,
                on_update: 'cascade' as const
              }
            ]
          }
        ]
      });
      expect(result.success).toBe(false);
    });

    it('should reject FK referencing table without constraints', () => {
      const result = Psql15_0_Schema.safeParse({
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
            ]
          },
          {
            id: 2,
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
                name: 'pk_orders',
                type: 'primary_key' as const,
                columns: ['id']
              },
              {
                id: 2,
                name: 'fk_orders_user',
                type: 'foreign_key' as const,
                columns: ['user_id'],
                references: {
                  table: 'users',
                  columns: ['id']
                },
                on_delete: 'cascade' as const,
                on_update: 'cascade' as const
              }
            ]
          }
        ]
      });
      expect(result.success).toBe(false);
    });

    it('should accept FK referencing unique constraint', () => {
      const result = Psql15_0_Schema.safeParse({
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
                type: 'text' as const,
                constraints: { nullable: false }
              }
            ],
            constraints: [
              {
                id: 1,
                name: 'pk_users',
                type: 'primary_key' as const,
                columns: ['id']
              },
              {
                id: 2,
                name: 'unique_email',
                type: 'unique' as const,
                columns: ['email']
              }
            ]
          },
          {
            id: 2,
            name: 'profiles',
            columns: [
              {
                id: 1,
                name: 'id',
                type: 'serial' as const,
                constraints: { nullable: false }
              },
              { id: 2, name: 'user_email', type: 'text' as const }
            ],
            constraints: [
              {
                id: 1,
                name: 'pk_profiles',
                type: 'primary_key' as const,
                columns: ['id']
              },
              {
                id: 2,
                name: 'fk_profiles_user',
                type: 'foreign_key' as const,
                columns: ['user_email'],
                references: {
                  table: 'users',
                  columns: ['email']
                },
                on_delete: 'cascade' as const,
                on_update: 'cascade' as const
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
      const result = Psql15_0_Schema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should reject extra fields (strict mode)', () => {
      const result = Psql15_0_Schema.safeParse({
        ...validSchema,
        extra: 'field'
      });
      expect(result.success).toBe(false);
    });
  });
});
