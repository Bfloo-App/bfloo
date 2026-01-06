// Package imports
import { describe, it, expect } from 'bun:test';

// Project imports
import { Psql15_0_ColumnSchema } from '../../../../../src/schemas/postgresql/v15.0/column/schema';

describe('[Unit] - Psql15_0_ColumnSchema', () => {
  const validTextColumn = {
    id: 1,
    name: 'username',
    type: 'text' as const
  };

  const validIntegerColumn = {
    id: 2,
    name: 'age',
    type: 'integer' as const
  };

  describe('Basic Functionality', () => {
    it('should accept valid text column', () => {
      const result = Psql15_0_ColumnSchema.safeParse(validTextColumn);
      expect(result.success).toBe(true);
    });

    it('should accept valid integer column', () => {
      const result = Psql15_0_ColumnSchema.safeParse(validIntegerColumn);
      expect(result.success).toBe(true);
    });

    it('should accept column with description', () => {
      const result = Psql15_0_ColumnSchema.safeParse({
        ...validTextColumn,
        description: 'User unique identifier'
      });
      expect(result.success).toBe(true);
    });

    it('should accept column with constraints', () => {
      const result = Psql15_0_ColumnSchema.safeParse({
        ...validTextColumn,
        constraints: { nullable: false }
      });
      expect(result.success).toBe(true);
    });

    it('should accept all column types', () => {
      const types = [
        'text',
        'integer',
        'serial',
        'boolean',
        'date',
        'timestamp'
      ] as const;
      for (const type of types) {
        const result = Psql15_0_ColumnSchema.safeParse({
          id: 1,
          name: 'test_column',
          type
        });
        expect(result.success).toBe(true);
      }
    });
  });

  describe('Default Value Validation', () => {
    it('should accept string default for text column', () => {
      const result = Psql15_0_ColumnSchema.safeParse({
        ...validTextColumn,
        default: 'anonymous'
      });
      expect(result.success).toBe(true);
    });

    it('should accept null default for text column', () => {
      const result = Psql15_0_ColumnSchema.safeParse({
        ...validTextColumn,
        default: null
      });
      expect(result.success).toBe(true);
    });

    it('should reject integer default for text column', () => {
      const result = Psql15_0_ColumnSchema.safeParse({
        ...validTextColumn,
        default: 42
      });
      expect(result.success).toBe(false);
    });

    it('should accept integer default for integer column', () => {
      const result = Psql15_0_ColumnSchema.safeParse({
        ...validIntegerColumn,
        default: 0
      });
      expect(result.success).toBe(true);
    });

    it('should reject string default for integer column', () => {
      const result = Psql15_0_ColumnSchema.safeParse({
        ...validIntegerColumn,
        default: '42'
      });
      expect(result.success).toBe(false);
    });

    it('should accept boolean default for boolean column', () => {
      const result = Psql15_0_ColumnSchema.safeParse({
        id: 1,
        name: 'is_active',
        type: 'boolean',
        default: false
      });
      expect(result.success).toBe(true);
    });

    it('should reject string default for boolean column', () => {
      const result = Psql15_0_ColumnSchema.safeParse({
        id: 1,
        name: 'is_active',
        type: 'boolean',
        default: 'true'
      });
      expect(result.success).toBe(false);
    });

    it('should accept current_date default for date column', () => {
      const result = Psql15_0_ColumnSchema.safeParse({
        id: 1,
        name: 'created_date',
        type: 'date',
        default: 'current_date'
      });
      expect(result.success).toBe(true);
    });

    it('should reject arbitrary string default for date column', () => {
      const result = Psql15_0_ColumnSchema.safeParse({
        id: 1,
        name: 'created_date',
        type: 'date',
        default: '2024-01-01'
      });
      expect(result.success).toBe(false);
    });

    it('should accept current_timestamp default for timestamp column', () => {
      const result = Psql15_0_ColumnSchema.safeParse({
        id: 1,
        name: 'created_at',
        type: 'timestamp',
        default: 'current_timestamp'
      });
      expect(result.success).toBe(true);
    });

    it('should reject default for serial column', () => {
      const result = Psql15_0_ColumnSchema.safeParse({
        id: 1,
        name: 'id',
        type: 'serial',
        default: 1
      });
      expect(result.success).toBe(false);
    });

    it('should reject default=null with nullable=false', () => {
      const result = Psql15_0_ColumnSchema.safeParse({
        ...validTextColumn,
        default: null,
        constraints: { nullable: false }
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Type-Specific Constraint Validation', () => {
    it('should accept min_length constraint for text column', () => {
      const result = Psql15_0_ColumnSchema.safeParse({
        ...validTextColumn,
        constraints: {
          nullable: false,
          min_length: { name: 'chk_min', value: 1 }
        }
      });
      expect(result.success).toBe(true);
    });

    it('should reject min_length constraint for integer column', () => {
      const result = Psql15_0_ColumnSchema.safeParse({
        ...validIntegerColumn,
        constraints: {
          nullable: true,
          min_length: { name: 'chk_min', value: 1 }
        }
      });
      expect(result.success).toBe(false);
    });

    it('should reject max_length constraint for integer column', () => {
      const result = Psql15_0_ColumnSchema.safeParse({
        ...validIntegerColumn,
        constraints: {
          nullable: true,
          max_length: { name: 'chk_max', value: 100 }
        }
      });
      expect(result.success).toBe(false);
    });

    it('should accept min_value constraint for integer column', () => {
      const result = Psql15_0_ColumnSchema.safeParse({
        ...validIntegerColumn,
        constraints: {
          nullable: false,
          min_value: { name: 'chk_min', value: 0 }
        }
      });
      expect(result.success).toBe(true);
    });

    it('should reject min_value constraint for text column', () => {
      const result = Psql15_0_ColumnSchema.safeParse({
        ...validTextColumn,
        constraints: {
          nullable: true,
          min_value: { name: 'chk_min', value: 0 }
        }
      });
      expect(result.success).toBe(false);
    });

    it('should reject max_value constraint for text column', () => {
      const result = Psql15_0_ColumnSchema.safeParse({
        ...validTextColumn,
        constraints: {
          nullable: true,
          max_value: { name: 'chk_max', value: 100 }
        }
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should reject missing required fields', () => {
      const result = Psql15_0_ColumnSchema.safeParse({ id: 1 });
      expect(result.success).toBe(false);
    });

    it('should reject invalid column type', () => {
      const result = Psql15_0_ColumnSchema.safeParse({
        id: 1,
        name: 'test',
        type: 'varchar'
      });
      expect(result.success).toBe(false);
    });

    it('should reject extra fields (strict mode)', () => {
      const result = Psql15_0_ColumnSchema.safeParse({
        ...validTextColumn,
        extra: 'field'
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid column name', () => {
      const result = Psql15_0_ColumnSchema.safeParse({
        id: 1,
        name: 'Invalid Name',
        type: 'text'
      });
      expect(result.success).toBe(false);
    });
  });
});
