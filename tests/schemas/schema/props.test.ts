// Package imports
import { describe, it, expect } from 'bun:test';

// Project imports
import {
  Schema_IdProp,
  Schema_NameProp,
  Schema_EngineProp,
  Schema_DescriptionProp,
  Schema_CreatedAtProp,
  Schema_UpdatedAtProp,
  Project_IdProp
} from '../../../src/schemas/schema/props';
import { ENGINE_POSTGRESQL } from '../../../src/constants';

describe('[Unit] - Schema_IdProp', () => {
  describe('Basic Functionality', () => {
    it('should accept valid UUIDv4', () => {
      const result = Schema_IdProp.safeParse(
        'c56a4180-65aa-42ec-a945-5fd21dec0538'
      );
      expect(result.success).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should reject invalid UUID format', () => {
      const result = Schema_IdProp.safeParse('invalid-uuid');
      expect(result.success).toBe(false);
    });

    it('should reject empty string', () => {
      const result = Schema_IdProp.safeParse('');
      expect(result.success).toBe(false);
    });

    it('should reject UUIDs without hyphens', () => {
      const result = Schema_IdProp.safeParse(
        '123e4567e89b12d3a456426614174000'
      );
      expect(result.success).toBe(false);
    });
  });
});

describe('[Unit] - Schema_NameProp', () => {
  describe('Basic Functionality', () => {
    it('should accept valid schema names', () => {
      const validNames = [
        'My Database',
        'Production-DB',
        'schema_v1.0',
        'Test123'
      ];
      for (const name of validNames) {
        const result = Schema_NameProp.safeParse(name);
        expect(result.success).toBe(true);
      }
    });

    it('should trim whitespace', () => {
      const result = Schema_NameProp.safeParse('  My Schema  ');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('My Schema');
      }
    });
  });

  describe('Edge Cases', () => {
    it('should reject empty string', () => {
      const result = Schema_NameProp.safeParse('');
      expect(result.success).toBe(false);
    });

    it('should reject names longer than 64 characters', () => {
      const result = Schema_NameProp.safeParse('a'.repeat(65));
      expect(result.success).toBe(false);
    });

    it('should accept name with exactly 64 characters', () => {
      const result = Schema_NameProp.safeParse('a'.repeat(64));
      expect(result.success).toBe(true);
    });

    it('should reject special characters not in pattern', () => {
      const result = Schema_NameProp.safeParse('My@Schema');
      expect(result.success).toBe(false);
    });
  });
});

describe('[Unit] - Schema_EngineProp', () => {
  describe('Basic Functionality', () => {
    it('should accept postgresql', () => {
      const result = Schema_EngineProp.safeParse(ENGINE_POSTGRESQL);
      expect(result.success).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should reject unsupported engine', () => {
      const result = Schema_EngineProp.safeParse('mysql');
      expect(result.success).toBe(false);
    });

    it('should reject display name', () => {
      const result = Schema_EngineProp.safeParse('PostgreSQL');
      expect(result.success).toBe(false);
    });
  });
});

describe('[Unit] - Schema_DescriptionProp', () => {
  describe('Basic Functionality', () => {
    it('should accept valid description', () => {
      const result = Schema_DescriptionProp.safeParse('This is a description');
      expect(result.success).toBe(true);
    });

    it('should accept null', () => {
      const result = Schema_DescriptionProp.safeParse(null);
      expect(result.success).toBe(true);
    });

    it('should trim whitespace', () => {
      const result = Schema_DescriptionProp.safeParse('  My description  ');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('My description');
      }
    });
  });

  describe('Edge Cases', () => {
    it('should reject descriptions longer than 256 characters', () => {
      const result = Schema_DescriptionProp.safeParse('a'.repeat(257));
      expect(result.success).toBe(false);
    });

    it('should accept description with exactly 256 characters', () => {
      const result = Schema_DescriptionProp.safeParse('a'.repeat(256));
      expect(result.success).toBe(true);
    });
  });
});

describe('[Unit] - Schema_CreatedAtProp', () => {
  describe('Basic Functionality', () => {
    it('should accept Date object', () => {
      const result = Schema_CreatedAtProp.safeParse(new Date());
      expect(result.success).toBe(true);
    });

    it('should coerce ISO date string', () => {
      const result = Schema_CreatedAtProp.safeParse('2024-01-15T10:30:00Z');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeInstanceOf(Date);
      }
    });

    it('should coerce timestamp number', () => {
      const result = Schema_CreatedAtProp.safeParse(1705316400000);
      expect(result.success).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should reject invalid date string', () => {
      const result = Schema_CreatedAtProp.safeParse('not-a-date');
      expect(result.success).toBe(false);
    });
  });
});

describe('[Unit] - Schema_UpdatedAtProp', () => {
  describe('Basic Functionality', () => {
    it('should accept Date object', () => {
      const result = Schema_UpdatedAtProp.safeParse(new Date());
      expect(result.success).toBe(true);
    });

    it('should coerce ISO date string', () => {
      const result = Schema_UpdatedAtProp.safeParse('2024-01-15T10:30:00Z');
      expect(result.success).toBe(true);
    });
  });
});

describe('[Unit] - Project_IdProp', () => {
  describe('Basic Functionality', () => {
    it('should accept valid UUIDv4', () => {
      const result = Project_IdProp.safeParse(
        'c56a4180-65aa-42ec-a945-5fd21dec0538'
      );
      expect(result.success).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should reject invalid UUID format', () => {
      const result = Project_IdProp.safeParse('invalid-uuid');
      expect(result.success).toBe(false);
    });
  });
});
