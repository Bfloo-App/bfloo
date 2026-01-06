// Package imports
import { describe, it, expect } from 'bun:test';

// Project imports
import {
  Psql15_0_Constraint_IdProp,
  Psql15_0_Constraint_NameProp,
  Psql15_0_Constraint_TypeEnum,
  Psql15_0_Constraint_DescriptionProp,
  Psql15_0_Constraint_ColumnNameProp,
  Psql15_0_Constraint_ColumnsProp,
  Psql15_0_Constraint_TableNameProp,
  Psql15_0_Constraint_ReferentialActionEnum,
  Psql15_0_Constraint_References,
  Psql15_0_Constraint_OnDeleteProp,
  Psql15_0_Constraint_OnUpdateProp
} from '../../../../../src/schemas/postgresql/v15.0/constraint/props';

describe('[Unit] - Psql15_0_Constraint_IdProp', () => {
  describe('Basic Functionality', () => {
    it('should accept positive integers', () => {
      const validIds = [1, 100, 999999];
      for (const id of validIds) {
        const result = Psql15_0_Constraint_IdProp.safeParse(id);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should reject zero', () => {
      const result = Psql15_0_Constraint_IdProp.safeParse(0);
      expect(result.success).toBe(false);
    });

    it('should reject negative numbers', () => {
      const result = Psql15_0_Constraint_IdProp.safeParse(-1);
      expect(result.success).toBe(false);
    });

    it('should reject non-integers', () => {
      const result = Psql15_0_Constraint_IdProp.safeParse(1.5);
      expect(result.success).toBe(false);
    });
  });
});

describe('[Unit] - Psql15_0_Constraint_NameProp', () => {
  describe('Basic Functionality', () => {
    it('should accept valid constraint names', () => {
      const validNames = ['pk_users', 'fk_orders_user', 'unique_email'];
      for (const name of validNames) {
        const result = Psql15_0_Constraint_NameProp.safeParse(name);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should reject empty string', () => {
      const result = Psql15_0_Constraint_NameProp.safeParse('');
      expect(result.success).toBe(false);
    });

    it('should reject names longer than 63 characters', () => {
      const result = Psql15_0_Constraint_NameProp.safeParse('a'.repeat(64));
      expect(result.success).toBe(false);
    });

    it('should reject uppercase characters', () => {
      const result = Psql15_0_Constraint_NameProp.safeParse('PK_Users');
      expect(result.success).toBe(false);
    });

    it('should reject names starting with number', () => {
      const result = Psql15_0_Constraint_NameProp.safeParse('123pk');
      expect(result.success).toBe(false);
    });
  });
});

describe('[Unit] - Psql15_0_Constraint_TypeEnum', () => {
  describe('Basic Functionality', () => {
    it('should accept all valid constraint types', () => {
      const validTypes = ['foreign_key', 'unique', 'primary_key'] as const;
      for (const type of validTypes) {
        const result = Psql15_0_Constraint_TypeEnum.safeParse(type);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should reject invalid constraint type', () => {
      const result = Psql15_0_Constraint_TypeEnum.safeParse('check');
      expect(result.success).toBe(false);
    });

    it('should reject uppercase types', () => {
      const result = Psql15_0_Constraint_TypeEnum.safeParse('PRIMARY_KEY');
      expect(result.success).toBe(false);
    });
  });
});

describe('[Unit] - Psql15_0_Constraint_DescriptionProp', () => {
  describe('Basic Functionality', () => {
    it('should accept valid descriptions', () => {
      const result = Psql15_0_Constraint_DescriptionProp.safeParse(
        'Primary key constraint'
      );
      expect(result.success).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should reject descriptions longer than 256 characters', () => {
      const result = Psql15_0_Constraint_DescriptionProp.safeParse(
        'a'.repeat(257)
      );
      expect(result.success).toBe(false);
    });
  });
});

describe('[Unit] - Psql15_0_Constraint_ColumnNameProp', () => {
  describe('Basic Functionality', () => {
    it('should accept valid column names', () => {
      const validNames = ['id', 'user_id', 'created_at'];
      for (const name of validNames) {
        const result = Psql15_0_Constraint_ColumnNameProp.safeParse(name);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should reject invalid column name format', () => {
      const result = Psql15_0_Constraint_ColumnNameProp.safeParse('123id');
      expect(result.success).toBe(false);
    });
  });
});

describe('[Unit] - Psql15_0_Constraint_ColumnsProp', () => {
  describe('Basic Functionality', () => {
    it('should accept array of valid column names', () => {
      const result = Psql15_0_Constraint_ColumnsProp.safeParse([
        'id',
        'user_id'
      ]);
      expect(result.success).toBe(true);
    });

    it('should accept empty array', () => {
      const result = Psql15_0_Constraint_ColumnsProp.safeParse([]);
      expect(result.success).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should reject array with invalid column name', () => {
      const result = Psql15_0_Constraint_ColumnsProp.safeParse([
        'id',
        'Invalid'
      ]);
      expect(result.success).toBe(false);
    });
  });
});

describe('[Unit] - Psql15_0_Constraint_TableNameProp', () => {
  describe('Basic Functionality', () => {
    it('should accept valid table names', () => {
      const validNames = ['users', 'order_items', 'user_profiles'];
      for (const name of validNames) {
        const result = Psql15_0_Constraint_TableNameProp.safeParse(name);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should reject invalid table name format', () => {
      const result = Psql15_0_Constraint_TableNameProp.safeParse('Users');
      expect(result.success).toBe(false);
    });
  });
});

describe('[Unit] - Psql15_0_Constraint_ReferentialActionEnum', () => {
  describe('Basic Functionality', () => {
    it('should accept all valid referential actions', () => {
      const validActions = [
        'cascade',
        'set_null',
        'set_default',
        'restrict',
        'no_action'
      ] as const;
      for (const action of validActions) {
        const result =
          Psql15_0_Constraint_ReferentialActionEnum.safeParse(action);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should reject invalid action', () => {
      const result =
        Psql15_0_Constraint_ReferentialActionEnum.safeParse('delete');
      expect(result.success).toBe(false);
    });

    it('should reject uppercase actions', () => {
      const result =
        Psql15_0_Constraint_ReferentialActionEnum.safeParse('CASCADE');
      expect(result.success).toBe(false);
    });
  });
});

describe('[Unit] - Psql15_0_Constraint_References', () => {
  describe('Basic Functionality', () => {
    it('should accept valid references', () => {
      const result = Psql15_0_Constraint_References.safeParse({
        table: 'users',
        columns: ['id']
      });
      expect(result.success).toBe(true);
    });

    it('should accept references with multiple columns', () => {
      const result = Psql15_0_Constraint_References.safeParse({
        table: 'composite_keys',
        columns: ['key1', 'key2']
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should reject missing table', () => {
      const result = Psql15_0_Constraint_References.safeParse({
        columns: ['id']
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing columns', () => {
      const result = Psql15_0_Constraint_References.safeParse({
        table: 'users'
      });
      expect(result.success).toBe(false);
    });

    it('should reject extra fields (strict)', () => {
      const result = Psql15_0_Constraint_References.safeParse({
        table: 'users',
        columns: ['id'],
        extra: 'field'
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('[Unit] - Psql15_0_Constraint_OnDeleteProp', () => {
  describe('Basic Functionality', () => {
    it('should accept cascade', () => {
      const result = Psql15_0_Constraint_OnDeleteProp.safeParse('cascade');
      expect(result.success).toBe(true);
    });
  });
});

describe('[Unit] - Psql15_0_Constraint_OnUpdateProp', () => {
  describe('Basic Functionality', () => {
    it('should accept cascade', () => {
      const result = Psql15_0_Constraint_OnUpdateProp.safeParse('cascade');
      expect(result.success).toBe(true);
    });
  });
});
