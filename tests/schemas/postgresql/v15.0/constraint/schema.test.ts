// Package imports
import { describe, it, expect } from 'bun:test';

// Project imports
import { Psql15_0_ConstraintSchema } from '../../../../../src/schemas/postgresql/v15.0/constraint/schema';

describe('[Unit] - Psql15_0_ConstraintSchema', () => {
  const validPrimaryKey = {
    id: 1,
    name: 'pk_users',
    type: 'primary_key' as const,
    columns: ['id']
  };

  const validUniqueConstraint = {
    id: 2,
    name: 'unique_email',
    type: 'unique' as const,
    columns: ['email']
  };

  const validForeignKey = {
    id: 3,
    name: 'fk_orders_user',
    type: 'foreign_key' as const,
    columns: ['user_id'],
    references: {
      table: 'users',
      columns: ['id']
    },
    on_delete: 'cascade' as const,
    on_update: 'cascade' as const
  };

  describe('Basic Functionality', () => {
    it('should accept valid primary key constraint', () => {
      const result = Psql15_0_ConstraintSchema.safeParse(validPrimaryKey);
      expect(result.success).toBe(true);
    });

    it('should accept valid unique constraint', () => {
      const result = Psql15_0_ConstraintSchema.safeParse(validUniqueConstraint);
      expect(result.success).toBe(true);
    });

    it('should accept valid foreign key constraint', () => {
      const result = Psql15_0_ConstraintSchema.safeParse(validForeignKey);
      expect(result.success).toBe(true);
    });

    it('should accept constraint with description', () => {
      const result = Psql15_0_ConstraintSchema.safeParse({
        ...validPrimaryKey,
        description: 'Primary key for users table'
      });
      expect(result.success).toBe(true);
    });

    it('should accept constraint with multiple columns', () => {
      const result = Psql15_0_ConstraintSchema.safeParse({
        id: 1,
        name: 'pk_composite',
        type: 'primary_key' as const,
        columns: ['key1', 'key2']
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Foreign Key Validation', () => {
    it('should require references for foreign key', () => {
      const { references: _, ...fkWithoutReferences } = validForeignKey;
      const result = Psql15_0_ConstraintSchema.safeParse(fkWithoutReferences);
      expect(result.success).toBe(false);
    });

    it('should require on_delete for foreign key', () => {
      const { on_delete: _, ...fkWithoutOnDelete } = validForeignKey;
      const result = Psql15_0_ConstraintSchema.safeParse(fkWithoutOnDelete);
      expect(result.success).toBe(false);
    });

    it('should require on_update for foreign key', () => {
      const { on_update: _, ...fkWithoutOnUpdate } = validForeignKey;
      const result = Psql15_0_ConstraintSchema.safeParse(fkWithoutOnUpdate);
      expect(result.success).toBe(false);
    });

    it('should accept all referential actions for on_delete', () => {
      const actions = [
        'cascade',
        'set_null',
        'set_default',
        'restrict',
        'no_action'
      ] as const;
      for (const action of actions) {
        const result = Psql15_0_ConstraintSchema.safeParse({
          ...validForeignKey,
          on_delete: action
        });
        expect(result.success).toBe(true);
      }
    });

    it('should accept all referential actions for on_update', () => {
      const actions = [
        'cascade',
        'set_null',
        'set_default',
        'restrict',
        'no_action'
      ] as const;
      for (const action of actions) {
        const result = Psql15_0_ConstraintSchema.safeParse({
          ...validForeignKey,
          on_update: action
        });
        expect(result.success).toBe(true);
      }
    });
  });

  describe('Non-Foreign Key Validation', () => {
    it('should reject references on primary key', () => {
      const result = Psql15_0_ConstraintSchema.safeParse({
        ...validPrimaryKey,
        references: { table: 'users', columns: ['id'] }
      });
      expect(result.success).toBe(false);
    });

    it('should reject on_delete on unique constraint', () => {
      const result = Psql15_0_ConstraintSchema.safeParse({
        ...validUniqueConstraint,
        on_delete: 'cascade'
      });
      expect(result.success).toBe(false);
    });

    it('should reject on_update on primary key', () => {
      const result = Psql15_0_ConstraintSchema.safeParse({
        ...validPrimaryKey,
        on_update: 'cascade'
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should reject missing required fields', () => {
      const result = Psql15_0_ConstraintSchema.safeParse({
        id: 1,
        type: 'primary_key'
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid constraint type', () => {
      const result = Psql15_0_ConstraintSchema.safeParse({
        ...validPrimaryKey,
        type: 'check'
      });
      expect(result.success).toBe(false);
    });

    it('should reject extra fields (strict mode)', () => {
      const result = Psql15_0_ConstraintSchema.safeParse({
        ...validPrimaryKey,
        extra: 'field'
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid column names in columns array', () => {
      const result = Psql15_0_ConstraintSchema.safeParse({
        ...validPrimaryKey,
        columns: ['Invalid']
      });
      expect(result.success).toBe(false);
    });
  });
});
