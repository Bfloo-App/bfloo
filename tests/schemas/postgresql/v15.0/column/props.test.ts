// Package imports
import { describe, it, expect } from 'bun:test';

// Project imports
import {
  Psql15_0_Column_IdProp,
  Psql15_0_Column_NameProp,
  Psql15_0_Column_TypeEnum,
  Psql15_0_Column_DescriptionProp,
  Psql15_0_Column_DefaultProp,
  Psql15_0_Column_ConstraintNameProp,
  Psql15_0_Column_NullableProp,
  Psql15_0_Column_MinLengthConstraint,
  Psql15_0_Column_MaxLengthConstraint,
  Psql15_0_Column_MinValueConstraint,
  Psql15_0_Column_MaxValueConstraint,
  Psql15_0_Column_BaseConstraints,
  Psql15_0_Column_TextConstraints,
  Psql15_0_Column_IntegerConstraints
} from '../../../../../src/schemas/postgresql/v15.0/column/props';

describe('[Unit] - Psql15_0_Column_IdProp', () => {
  describe('Basic Functionality', () => {
    it('should accept positive integers', () => {
      const validIds = [1, 100, 999999];
      for (const id of validIds) {
        const result = Psql15_0_Column_IdProp.safeParse(id);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should reject zero', () => {
      const result = Psql15_0_Column_IdProp.safeParse(0);
      expect(result.success).toBe(false);
    });

    it('should reject negative numbers', () => {
      const result = Psql15_0_Column_IdProp.safeParse(-1);
      expect(result.success).toBe(false);
    });

    it('should reject non-integers', () => {
      const result = Psql15_0_Column_IdProp.safeParse(1.5);
      expect(result.success).toBe(false);
    });
  });
});

describe('[Unit] - Psql15_0_Column_NameProp', () => {
  describe('Basic Functionality', () => {
    it('should accept valid column names', () => {
      const validNames = ['id', 'user_id', 'created_at', 'column123'];
      for (const name of validNames) {
        const result = Psql15_0_Column_NameProp.safeParse(name);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should reject empty string', () => {
      const result = Psql15_0_Column_NameProp.safeParse('');
      expect(result.success).toBe(false);
    });

    it('should reject names longer than 63 characters', () => {
      const result = Psql15_0_Column_NameProp.safeParse('a'.repeat(64));
      expect(result.success).toBe(false);
    });

    it('should accept name with exactly 63 characters', () => {
      const result = Psql15_0_Column_NameProp.safeParse('a'.repeat(63));
      expect(result.success).toBe(true);
    });

    it('should reject uppercase characters', () => {
      const result = Psql15_0_Column_NameProp.safeParse('UserId');
      expect(result.success).toBe(false);
    });

    it('should reject names starting with number', () => {
      const result = Psql15_0_Column_NameProp.safeParse('123column');
      expect(result.success).toBe(false);
    });

    it('should reject names starting with underscore', () => {
      const result = Psql15_0_Column_NameProp.safeParse('_column');
      expect(result.success).toBe(false);
    });

    it('should reject names with hyphens', () => {
      const result = Psql15_0_Column_NameProp.safeParse('user-id');
      expect(result.success).toBe(false);
    });
  });
});

describe('[Unit] - Psql15_0_Column_TypeEnum', () => {
  describe('Basic Functionality', () => {
    it('should accept all valid column types', () => {
      const validTypes = [
        'text',
        'integer',
        'serial',
        'boolean',
        'date',
        'timestamp'
      ] as const;
      for (const type of validTypes) {
        const result = Psql15_0_Column_TypeEnum.safeParse(type);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should reject invalid column type', () => {
      const result = Psql15_0_Column_TypeEnum.safeParse('varchar');
      expect(result.success).toBe(false);
    });

    it('should reject uppercase types', () => {
      const result = Psql15_0_Column_TypeEnum.safeParse('TEXT');
      expect(result.success).toBe(false);
    });
  });
});

describe('[Unit] - Psql15_0_Column_DescriptionProp', () => {
  describe('Basic Functionality', () => {
    it('should accept valid descriptions', () => {
      const result = Psql15_0_Column_DescriptionProp.safeParse(
        'This is a description'
      );
      expect(result.success).toBe(true);
    });

    it('should accept empty string', () => {
      const result = Psql15_0_Column_DescriptionProp.safeParse('');
      expect(result.success).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should reject descriptions longer than 256 characters', () => {
      const result = Psql15_0_Column_DescriptionProp.safeParse('a'.repeat(257));
      expect(result.success).toBe(false);
    });

    it('should accept description with exactly 256 characters', () => {
      const result = Psql15_0_Column_DescriptionProp.safeParse('a'.repeat(256));
      expect(result.success).toBe(true);
    });
  });
});

describe('[Unit] - Psql15_0_Column_DefaultProp', () => {
  describe('Basic Functionality', () => {
    it('should accept string values', () => {
      const result = Psql15_0_Column_DefaultProp.safeParse('default_value');
      expect(result.success).toBe(true);
    });

    it('should accept integer values', () => {
      const result = Psql15_0_Column_DefaultProp.safeParse(42);
      expect(result.success).toBe(true);
    });

    it('should accept boolean values', () => {
      const resultTrue = Psql15_0_Column_DefaultProp.safeParse(true);
      const resultFalse = Psql15_0_Column_DefaultProp.safeParse(false);
      expect(resultTrue.success).toBe(true);
      expect(resultFalse.success).toBe(true);
    });

    it('should accept null', () => {
      const result = Psql15_0_Column_DefaultProp.safeParse(null);
      expect(result.success).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should reject float values', () => {
      const result = Psql15_0_Column_DefaultProp.safeParse(3.14);
      expect(result.success).toBe(false);
    });

    it('should reject objects', () => {
      const result = Psql15_0_Column_DefaultProp.safeParse({ key: 'value' });
      expect(result.success).toBe(false);
    });

    it('should reject arrays', () => {
      const result = Psql15_0_Column_DefaultProp.safeParse([1, 2, 3]);
      expect(result.success).toBe(false);
    });
  });
});

describe('[Unit] - Psql15_0_Column_ConstraintNameProp', () => {
  describe('Basic Functionality', () => {
    it('should accept valid constraint names', () => {
      const validNames = [
        'chk_min_length',
        'constraint123',
        'users_email_unique'
      ];
      for (const name of validNames) {
        const result = Psql15_0_Column_ConstraintNameProp.safeParse(name);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should reject names starting with number', () => {
      const result = Psql15_0_Column_ConstraintNameProp.safeParse('123chk');
      expect(result.success).toBe(false);
    });

    it('should reject uppercase characters', () => {
      const result = Psql15_0_Column_ConstraintNameProp.safeParse('Check_Name');
      expect(result.success).toBe(false);
    });
  });
});

describe('[Unit] - Psql15_0_Column_NullableProp', () => {
  describe('Basic Functionality', () => {
    it('should accept true', () => {
      const result = Psql15_0_Column_NullableProp.safeParse(true);
      expect(result.success).toBe(true);
    });

    it('should accept false', () => {
      const result = Psql15_0_Column_NullableProp.safeParse(false);
      expect(result.success).toBe(true);
    });

    it('should default to true', () => {
      const result = Psql15_0_Column_NullableProp.safeParse(undefined);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should reject non-boolean values', () => {
      const result = Psql15_0_Column_NullableProp.safeParse('true');
      expect(result.success).toBe(false);
    });
  });
});

describe('[Unit] - Psql15_0_Column_MinLengthConstraint', () => {
  describe('Basic Functionality', () => {
    it('should accept valid min_length constraint', () => {
      const result = Psql15_0_Column_MinLengthConstraint.safeParse({
        name: 'chk_min_length',
        value: 5
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should reject missing name', () => {
      const result = Psql15_0_Column_MinLengthConstraint.safeParse({
        value: 5
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing value', () => {
      const result = Psql15_0_Column_MinLengthConstraint.safeParse({
        name: 'chk_min_length'
      });
      expect(result.success).toBe(false);
    });

    it('should reject extra fields (strict)', () => {
      const result = Psql15_0_Column_MinLengthConstraint.safeParse({
        name: 'chk_min_length',
        value: 5,
        extra: 'field'
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('[Unit] - Psql15_0_Column_MaxLengthConstraint', () => {
  describe('Basic Functionality', () => {
    it('should accept valid max_length constraint', () => {
      const result = Psql15_0_Column_MaxLengthConstraint.safeParse({
        name: 'chk_max_length',
        value: 100
      });
      expect(result.success).toBe(true);
    });
  });
});

describe('[Unit] - Psql15_0_Column_MinValueConstraint', () => {
  describe('Basic Functionality', () => {
    it('should accept valid min_value constraint', () => {
      const result = Psql15_0_Column_MinValueConstraint.safeParse({
        name: 'chk_min_value',
        value: 0
      });
      expect(result.success).toBe(true);
    });

    it('should accept negative min values', () => {
      const result = Psql15_0_Column_MinValueConstraint.safeParse({
        name: 'chk_min_value',
        value: -100
      });
      expect(result.success).toBe(true);
    });
  });
});

describe('[Unit] - Psql15_0_Column_MaxValueConstraint', () => {
  describe('Basic Functionality', () => {
    it('should accept valid max_value constraint', () => {
      const result = Psql15_0_Column_MaxValueConstraint.safeParse({
        name: 'chk_max_value',
        value: 1000
      });
      expect(result.success).toBe(true);
    });
  });
});

describe('[Unit] - Psql15_0_Column_BaseConstraints', () => {
  describe('Basic Functionality', () => {
    it('should accept valid base constraints', () => {
      const result = Psql15_0_Column_BaseConstraints.safeParse({
        nullable: false
      });
      expect(result.success).toBe(true);
    });

    it('should apply default nullable', () => {
      const result = Psql15_0_Column_BaseConstraints.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nullable).toBe(true);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should reject extra fields (strict)', () => {
      const result = Psql15_0_Column_BaseConstraints.safeParse({
        nullable: true,
        extra: 'field'
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('[Unit] - Psql15_0_Column_TextConstraints', () => {
  describe('Basic Functionality', () => {
    it('should accept constraints with min_length', () => {
      const result = Psql15_0_Column_TextConstraints.safeParse({
        nullable: false,
        min_length: { name: 'chk_min', value: 1 }
      });
      expect(result.success).toBe(true);
    });

    it('should accept constraints with max_length', () => {
      const result = Psql15_0_Column_TextConstraints.safeParse({
        nullable: true,
        max_length: { name: 'chk_max', value: 255 }
      });
      expect(result.success).toBe(true);
    });

    it('should accept constraints with both min and max length', () => {
      const result = Psql15_0_Column_TextConstraints.safeParse({
        nullable: false,
        min_length: { name: 'chk_min', value: 1 },
        max_length: { name: 'chk_max', value: 255 }
      });
      expect(result.success).toBe(true);
    });
  });
});

describe('[Unit] - Psql15_0_Column_IntegerConstraints', () => {
  describe('Basic Functionality', () => {
    it('should accept constraints with min_value', () => {
      const result = Psql15_0_Column_IntegerConstraints.safeParse({
        nullable: false,
        min_value: { name: 'chk_min', value: 0 }
      });
      expect(result.success).toBe(true);
    });

    it('should accept constraints with max_value', () => {
      const result = Psql15_0_Column_IntegerConstraints.safeParse({
        nullable: true,
        max_value: { name: 'chk_max', value: 100 }
      });
      expect(result.success).toBe(true);
    });

    it('should accept constraints with both min and max value', () => {
      const result = Psql15_0_Column_IntegerConstraints.safeParse({
        nullable: false,
        min_value: { name: 'chk_min', value: 0 },
        max_value: { name: 'chk_max', value: 100 }
      });
      expect(result.success).toBe(true);
    });
  });
});
