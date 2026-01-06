// Package imports
import { describe, it, expect } from 'bun:test';

// Project imports
import {
  Psql15_0_Table_IdProp,
  Psql15_0_Table_NameProp,
  Psql15_0_Table_DescriptionProp,
  Psql15_0_Table_ColumnsProp,
  Psql15_0_Table_ConstraintsProp
} from '../../../../../src/schemas/postgresql/v15.0/table/props';

describe('[Unit] - Psql15_0_Table_IdProp', () => {
  describe('Basic Functionality', () => {
    it('should accept positive integers', () => {
      const validIds = [1, 100, 999999];
      for (const id of validIds) {
        const result = Psql15_0_Table_IdProp.safeParse(id);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should reject zero', () => {
      const result = Psql15_0_Table_IdProp.safeParse(0);
      expect(result.success).toBe(false);
    });

    it('should reject negative numbers', () => {
      const result = Psql15_0_Table_IdProp.safeParse(-1);
      expect(result.success).toBe(false);
    });

    it('should reject non-integers', () => {
      const result = Psql15_0_Table_IdProp.safeParse(1.5);
      expect(result.success).toBe(false);
    });
  });
});

describe('[Unit] - Psql15_0_Table_NameProp', () => {
  describe('Basic Functionality', () => {
    it('should accept valid table names', () => {
      const validNames = ['users', 'order_items', 'user_profiles123'];
      for (const name of validNames) {
        const result = Psql15_0_Table_NameProp.safeParse(name);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should reject empty string', () => {
      const result = Psql15_0_Table_NameProp.safeParse('');
      expect(result.success).toBe(false);
    });

    it('should reject names longer than 63 characters', () => {
      const result = Psql15_0_Table_NameProp.safeParse('a'.repeat(64));
      expect(result.success).toBe(false);
    });

    it('should accept name with exactly 63 characters', () => {
      const result = Psql15_0_Table_NameProp.safeParse('a'.repeat(63));
      expect(result.success).toBe(true);
    });

    it('should reject uppercase characters', () => {
      const result = Psql15_0_Table_NameProp.safeParse('Users');
      expect(result.success).toBe(false);
    });

    it('should reject names starting with number', () => {
      const result = Psql15_0_Table_NameProp.safeParse('123table');
      expect(result.success).toBe(false);
    });

    it('should reject names with hyphens', () => {
      const result = Psql15_0_Table_NameProp.safeParse('user-table');
      expect(result.success).toBe(false);
    });
  });
});

describe('[Unit] - Psql15_0_Table_DescriptionProp', () => {
  describe('Basic Functionality', () => {
    it('should accept valid descriptions', () => {
      const result = Psql15_0_Table_DescriptionProp.safeParse(
        'Table containing user data'
      );
      expect(result.success).toBe(true);
    });

    it('should accept empty string', () => {
      const result = Psql15_0_Table_DescriptionProp.safeParse('');
      expect(result.success).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should reject descriptions longer than 256 characters', () => {
      const result = Psql15_0_Table_DescriptionProp.safeParse('a'.repeat(257));
      expect(result.success).toBe(false);
    });

    it('should accept description with exactly 256 characters', () => {
      const result = Psql15_0_Table_DescriptionProp.safeParse('a'.repeat(256));
      expect(result.success).toBe(true);
    });
  });
});

describe('[Unit] - Psql15_0_Table_ColumnsProp', () => {
  const validColumn = {
    id: 1,
    name: 'test_column',
    type: 'text' as const
  };

  describe('Basic Functionality', () => {
    it('should accept array with valid columns', () => {
      const result = Psql15_0_Table_ColumnsProp.safeParse([validColumn]);
      expect(result.success).toBe(true);
    });

    it('should accept array with multiple columns', () => {
      const result = Psql15_0_Table_ColumnsProp.safeParse([
        validColumn,
        { id: 2, name: 'another_column', type: 'integer' as const }
      ]);
      expect(result.success).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should reject empty array', () => {
      const result = Psql15_0_Table_ColumnsProp.safeParse([]);
      expect(result.success).toBe(false);
    });

    it('should reject array with invalid column', () => {
      const result = Psql15_0_Table_ColumnsProp.safeParse([
        { id: 1, name: 'Invalid', type: 'text' }
      ]);
      expect(result.success).toBe(false);
    });
  });
});

describe('[Unit] - Psql15_0_Table_ConstraintsProp', () => {
  const validConstraint = {
    id: 1,
    name: 'pk_test',
    type: 'primary_key' as const,
    columns: ['id']
  };

  describe('Basic Functionality', () => {
    it('should accept array with valid constraints', () => {
      const result = Psql15_0_Table_ConstraintsProp.safeParse([
        validConstraint
      ]);
      expect(result.success).toBe(true);
    });

    it('should accept empty array', () => {
      const result = Psql15_0_Table_ConstraintsProp.safeParse([]);
      expect(result.success).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should reject array with invalid constraint', () => {
      const result = Psql15_0_Table_ConstraintsProp.safeParse([
        { id: 1, name: 'Invalid', type: 'check', columns: [] }
      ]);
      expect(result.success).toBe(false);
    });
  });
});
