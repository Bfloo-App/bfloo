// Package imports
import { describe, it, expect } from 'bun:test';

// Project imports
import {
  Manifest_LocalIdProp,
  Manifest_SnapshotIdProp,
  Manifest_ParentIdProp,
  Manifest_PsqlVersionProp,
  getDatabaseVersionProp,
  Manifest_CreatedAtProp,
  Manifest_FileProp,
  Manifest_SyncStateProp,
  Manifest_SyncedAtProp
} from '../../../src/schemas/manifest/props';
import { ENGINE_POSTGRESQL, PSQL_VERSION_15_0 } from '../../../src/constants';

describe('[Unit] - Manifest_LocalIdProp', () => {
  describe('Basic Functionality', () => {
    it('should accept valid local ID format', () => {
      const validLocalId = 'local-c56a4180-65aa-42ec-a945-5fd21dec0538';
      const result = Manifest_LocalIdProp.safeParse(validLocalId);
      expect(result.success).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should reject ID without local prefix', () => {
      const result = Manifest_LocalIdProp.safeParse(
        'c56a4180-65aa-42ec-a945-5fd21dec0538'
      );
      expect(result.success).toBe(false);
    });

    it('should reject ID with uppercase in UUID', () => {
      const result = Manifest_LocalIdProp.safeParse(
        'local-C56A4180-65AA-42EC-A945-5FD21DEC0538'
      );
      expect(result.success).toBe(false);
    });

    it('should reject invalid UUID format', () => {
      const result = Manifest_LocalIdProp.safeParse('local-invalid-uuid');
      expect(result.success).toBe(false);
    });

    it('should reject empty string', () => {
      const result = Manifest_LocalIdProp.safeParse('');
      expect(result.success).toBe(false);
    });
  });
});

describe('[Unit] - Manifest_SnapshotIdProp', () => {
  const validRemoteId = 'c56a4180-65aa-42ec-a945-5fd21dec0538';
  const validLocalId = 'local-c56a4180-65aa-42ec-a945-5fd21dec0538';

  describe('Basic Functionality', () => {
    it('should accept valid remote UUID', () => {
      const result = Manifest_SnapshotIdProp.safeParse(validRemoteId);
      expect(result.success).toBe(true);
    });

    it('should accept valid local ID', () => {
      const result = Manifest_SnapshotIdProp.safeParse(validLocalId);
      expect(result.success).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should reject invalid ID format', () => {
      const result = Manifest_SnapshotIdProp.safeParse('invalid-id');
      expect(result.success).toBe(false);
    });
  });
});

describe('[Unit] - Manifest_ParentIdProp', () => {
  describe('Basic Functionality', () => {
    it('should accept valid snapshot ID', () => {
      const result = Manifest_ParentIdProp.safeParse(
        'c56a4180-65aa-42ec-a945-5fd21dec0538'
      );
      expect(result.success).toBe(true);
    });

    it('should accept null', () => {
      const result = Manifest_ParentIdProp.safeParse(null);
      expect(result.success).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should reject undefined', () => {
      const result = Manifest_ParentIdProp.safeParse(undefined);
      expect(result.success).toBe(false);
    });
  });
});

describe('[Unit] - Manifest_PsqlVersionProp', () => {
  describe('Basic Functionality', () => {
    it('should accept supported PostgreSQL version', () => {
      const result = Manifest_PsqlVersionProp.safeParse(PSQL_VERSION_15_0);
      expect(result.success).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should reject unsupported version', () => {
      const result = Manifest_PsqlVersionProp.safeParse('v14.0');
      expect(result.success).toBe(false);
    });

    it('should reject version without v prefix', () => {
      const result = Manifest_PsqlVersionProp.safeParse('15.0');
      expect(result.success).toBe(false);
    });
  });
});

describe('[Unit] - getDatabaseVersionProp', () => {
  describe('Basic Functionality', () => {
    it('should return PostgreSQL version schema for postgresql engine', () => {
      const schema = getDatabaseVersionProp(ENGINE_POSTGRESQL);
      const result = schema.safeParse(PSQL_VERSION_15_0);
      expect(result.success).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should throw CliError for unsupported engine', () => {
      expect(() =>
        getDatabaseVersionProp('mysql' as typeof ENGINE_POSTGRESQL)
      ).toThrow('is not supported');
    });
  });
});

describe('[Unit] - Manifest_CreatedAtProp', () => {
  describe('Basic Functionality', () => {
    it('should accept valid ISO 8601 datetime with Z', () => {
      const result = Manifest_CreatedAtProp.safeParse('2024-01-15T10:30:00Z');
      expect(result.success).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should reject invalid datetime format', () => {
      const result = Manifest_CreatedAtProp.safeParse('2024-01-15');
      expect(result.success).toBe(false);
    });

    it('should reject non-string values', () => {
      const result = Manifest_CreatedAtProp.safeParse(new Date());
      expect(result.success).toBe(false);
    });
  });
});

describe('[Unit] - Manifest_FileProp', () => {
  describe('Basic Functionality', () => {
    it('should accept current literal', () => {
      const result = Manifest_FileProp.safeParse('current');
      expect(result.success).toBe(true);
    });

    it('should accept dated YAML file format', () => {
      const validFiles = [
        '2024-01-15_snapshot.yml',
        '2024-12-31_v1.0.0.yml',
        '2024-01-01_my_label-v2.yml',
        '2024-06-15_feature+build.123.yml',
        '2024-06-15_user@domain.yml'
      ];
      for (const file of validFiles) {
        const result = Manifest_FileProp.safeParse(file);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should reject invalid date format', () => {
      const result = Manifest_FileProp.safeParse('24-01-15_snapshot.yml');
      expect(result.success).toBe(false);
    });

    it('should reject non-yml extension', () => {
      const result = Manifest_FileProp.safeParse('2024-01-15_snapshot.yaml');
      expect(result.success).toBe(false);
    });

    it('should reject file without underscore separator', () => {
      const result = Manifest_FileProp.safeParse('2024-01-15snapshot.yml');
      expect(result.success).toBe(false);
    });
  });
});

describe('[Unit] - Manifest_SyncStateProp', () => {
  describe('Basic Functionality', () => {
    it('should accept all valid sync states', () => {
      const validStates = ['synced', 'local-only', 'orphaned'] as const;
      for (const state of validStates) {
        const result = Manifest_SyncStateProp.safeParse(state);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should reject invalid sync state', () => {
      const result = Manifest_SyncStateProp.safeParse('pending');
      expect(result.success).toBe(false);
    });

    it('should reject uppercase', () => {
      const result = Manifest_SyncStateProp.safeParse('SYNCED');
      expect(result.success).toBe(false);
    });
  });
});

describe('[Unit] - Manifest_SyncedAtProp', () => {
  describe('Basic Functionality', () => {
    it('should accept valid ISO 8601 datetime', () => {
      const result = Manifest_SyncedAtProp.safeParse('2024-01-15T10:30:00Z');
      expect(result.success).toBe(true);
    });

    it('should accept null', () => {
      const result = Manifest_SyncedAtProp.safeParse(null);
      expect(result.success).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should reject undefined', () => {
      const result = Manifest_SyncedAtProp.safeParse(undefined);
      expect(result.success).toBe(false);
    });

    it('should reject invalid datetime', () => {
      const result = Manifest_SyncedAtProp.safeParse('not-a-date');
      expect(result.success).toBe(false);
    });
  });
});
