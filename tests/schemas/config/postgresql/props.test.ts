// Package imports
import { describe, it, expect } from 'bun:test';

// Project imports
import {
  Config_PostgresqlEngineProp,
  Config_PostgresqlHostProp,
  Config_PostgresqlPortProp,
  Config_PostgresqlDbNameProp,
  Config_PostgresqlTargetSchemaProp,
  Config_PostgresqlUserProp,
  Config_PostgresqlPasswordProp,
  Config_PostgresqlSslModeProp,
  Config_PostgresqlConnectTimeoutProp
} from '../../../../src/schemas/config/postgresql/props';
import { ENGINE_POSTGRESQL_DISPLAY } from '../../../../src/constants';

describe('[Unit] - Config_PostgresqlEngineProp', () => {
  describe('Basic Functionality', () => {
    it('should accept PostgreSQL literal', () => {
      const result = Config_PostgresqlEngineProp.safeParse(
        ENGINE_POSTGRESQL_DISPLAY
      );
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(ENGINE_POSTGRESQL_DISPLAY);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should reject lowercase postgresql', () => {
      const result = Config_PostgresqlEngineProp.safeParse('postgresql');
      expect(result.success).toBe(false);
    });

    it('should reject other database engines', () => {
      const result = Config_PostgresqlEngineProp.safeParse('MySQL');
      expect(result.success).toBe(false);
    });
  });
});

describe('[Unit] - Config_PostgresqlHostProp', () => {
  describe('Basic Functionality', () => {
    it('should accept valid hostnames', () => {
      const validHosts = ['localhost', 'db.example.com', '192.168.1.1'];
      for (const host of validHosts) {
        const result = Config_PostgresqlHostProp.safeParse(host);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should reject empty string', () => {
      const result = Config_PostgresqlHostProp.safeParse('');
      expect(result.success).toBe(false);
    });

    it('should reject non-string values', () => {
      const result = Config_PostgresqlHostProp.safeParse(123);
      expect(result.success).toBe(false);
    });
  });
});

describe('[Unit] - Config_PostgresqlPortProp', () => {
  describe('Basic Functionality', () => {
    it('should accept valid port numbers', () => {
      const validPorts = [1, 5432, 65535];
      for (const port of validPorts) {
        const result = Config_PostgresqlPortProp.safeParse(port);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should reject port 0', () => {
      const result = Config_PostgresqlPortProp.safeParse(0);
      expect(result.success).toBe(false);
    });

    it('should reject port above 65535', () => {
      const result = Config_PostgresqlPortProp.safeParse(65536);
      expect(result.success).toBe(false);
    });

    it('should reject negative ports', () => {
      const result = Config_PostgresqlPortProp.safeParse(-1);
      expect(result.success).toBe(false);
    });

    it('should reject non-integer ports', () => {
      const result = Config_PostgresqlPortProp.safeParse(5432.5);
      expect(result.success).toBe(false);
    });

    it('should reject string ports', () => {
      const result = Config_PostgresqlPortProp.safeParse('5432');
      expect(result.success).toBe(false);
    });
  });
});

describe('[Unit] - Config_PostgresqlDbNameProp', () => {
  describe('Basic Functionality', () => {
    it('should accept valid database names', () => {
      const validNames = ['mydb', 'my_database', 'db123'];
      for (const name of validNames) {
        const result = Config_PostgresqlDbNameProp.safeParse(name);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should reject empty string', () => {
      const result = Config_PostgresqlDbNameProp.safeParse('');
      expect(result.success).toBe(false);
    });
  });
});

describe('[Unit] - Config_PostgresqlTargetSchemaProp', () => {
  describe('Basic Functionality', () => {
    it('should accept custom schema name', () => {
      const result = Config_PostgresqlTargetSchemaProp.safeParse('my_schema');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('my_schema');
      }
    });

    it('should use public as default', () => {
      const result = Config_PostgresqlTargetSchemaProp.safeParse(undefined);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('public');
      }
    });
  });

  describe('Edge Cases', () => {
    it('should accept empty string (overrides default)', () => {
      const result = Config_PostgresqlTargetSchemaProp.safeParse('');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('');
      }
    });
  });
});

describe('[Unit] - Config_PostgresqlUserProp', () => {
  describe('Basic Functionality', () => {
    it('should accept valid usernames', () => {
      const validUsers = ['postgres', 'admin', 'db_user'];
      for (const user of validUsers) {
        const result = Config_PostgresqlUserProp.safeParse(user);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should reject empty string', () => {
      const result = Config_PostgresqlUserProp.safeParse('');
      expect(result.success).toBe(false);
    });
  });
});

describe('[Unit] - Config_PostgresqlPasswordProp', () => {
  describe('Basic Functionality', () => {
    it('should accept any string password', () => {
      const validPasswords = ['', 'secret', 'P@ssw0rd!', '   '];
      for (const password of validPasswords) {
        const result = Config_PostgresqlPasswordProp.safeParse(password);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should accept empty string', () => {
      const result = Config_PostgresqlPasswordProp.safeParse('');
      expect(result.success).toBe(true);
    });

    it('should reject non-string values', () => {
      const result = Config_PostgresqlPasswordProp.safeParse(123);
      expect(result.success).toBe(false);
    });
  });
});

describe('[Unit] - Config_PostgresqlSslModeProp', () => {
  describe('Basic Functionality', () => {
    it('should accept all valid SSL modes', () => {
      const validModes = [
        'disable',
        'allow',
        'prefer',
        'require',
        'verify-ca',
        'verify-full'
      ] as const;
      for (const mode of validModes) {
        const result = Config_PostgresqlSslModeProp.safeParse(mode);
        expect(result.success).toBe(true);
      }
    });

    it('should use prefer as default', () => {
      const result = Config_PostgresqlSslModeProp.safeParse(undefined);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('prefer');
      }
    });
  });

  describe('Edge Cases', () => {
    it('should reject invalid SSL mode', () => {
      const result = Config_PostgresqlSslModeProp.safeParse('invalid');
      expect(result.success).toBe(false);
    });

    it('should reject uppercase SSL modes', () => {
      const result = Config_PostgresqlSslModeProp.safeParse('REQUIRE');
      expect(result.success).toBe(false);
    });
  });
});

describe('[Unit] - Config_PostgresqlConnectTimeoutProp', () => {
  describe('Basic Functionality', () => {
    it('should accept positive integers', () => {
      const validTimeouts = [1, 10, 30, 60];
      for (const timeout of validTimeouts) {
        const result = Config_PostgresqlConnectTimeoutProp.safeParse(timeout);
        expect(result.success).toBe(true);
      }
    });

    it('should use 10 as default', () => {
      const result = Config_PostgresqlConnectTimeoutProp.safeParse(undefined);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(10);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should reject zero', () => {
      const result = Config_PostgresqlConnectTimeoutProp.safeParse(0);
      expect(result.success).toBe(false);
    });

    it('should reject negative numbers', () => {
      const result = Config_PostgresqlConnectTimeoutProp.safeParse(-5);
      expect(result.success).toBe(false);
    });

    it('should reject non-integer numbers', () => {
      const result = Config_PostgresqlConnectTimeoutProp.safeParse(10.5);
      expect(result.success).toBe(false);
    });
  });
});
