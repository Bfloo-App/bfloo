// Package imports
import { describe, it, expect } from 'bun:test';

// Project imports
import { Schema_Schema } from '../../../src/schemas/schema/schema';
import { ENGINE_POSTGRESQL } from '../../../src/constants';

describe('[Unit] - Schema_Schema', () => {
  const validSchema = {
    id: 'c56a4180-65aa-42ec-a945-5fd21dec0538',
    projectId: 'c56a4180-65aa-42ec-a945-5fd21dec0539',
    name: 'My Database',
    engine: ENGINE_POSTGRESQL,
    description: 'A test database schema',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  };

  describe('Basic Functionality', () => {
    it('should accept valid schema object', () => {
      const result = Schema_Schema.safeParse(validSchema);
      expect(result.success).toBe(true);
    });

    it('should accept schema with null description', () => {
      const result = Schema_Schema.safeParse({
        ...validSchema,
        description: null
      });
      expect(result.success).toBe(true);
    });

    it('should coerce date strings to Date objects', () => {
      const result = Schema_Schema.safeParse(validSchema);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.createdAt).toBeInstanceOf(Date);
        expect(result.data.updatedAt).toBeInstanceOf(Date);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should reject missing id', () => {
      const { id: _, ...schemaWithoutId } = validSchema;
      const result = Schema_Schema.safeParse(schemaWithoutId);
      expect(result.success).toBe(false);
    });

    it('should reject missing projectId', () => {
      const { projectId: _, ...schemaWithoutProjectId } = validSchema;
      const result = Schema_Schema.safeParse(schemaWithoutProjectId);
      expect(result.success).toBe(false);
    });

    it('should reject missing name', () => {
      const { name: _, ...schemaWithoutName } = validSchema;
      const result = Schema_Schema.safeParse(schemaWithoutName);
      expect(result.success).toBe(false);
    });

    it('should reject missing engine', () => {
      const { engine: _, ...schemaWithoutEngine } = validSchema;
      const result = Schema_Schema.safeParse(schemaWithoutEngine);
      expect(result.success).toBe(false);
    });

    it('should reject invalid engine', () => {
      const result = Schema_Schema.safeParse({
        ...validSchema,
        engine: 'mysql'
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid UUID for id', () => {
      const result = Schema_Schema.safeParse({
        ...validSchema,
        id: 'invalid-uuid'
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid UUID for projectId', () => {
      const result = Schema_Schema.safeParse({
        ...validSchema,
        projectId: 'invalid-uuid'
      });
      expect(result.success).toBe(false);
    });
  });
});
