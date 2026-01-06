// Package imports
import { describe, expect, test } from 'bun:test';

// Project imports
import {
  ENGINE_DISPLAY_NAMES,
  ENGINE_KEY_POSTGRESQL_15_0,
  ENGINE_POSTGRESQL,
  ENGINE_POSTGRESQL_DISPLAY,
  PSQL_VERSION_15_0,
  resolveEngineDisplayName,
  SUPPORTED_DATABASE_ENGINES,
  SUPPORTED_ENGINE_DISPLAY_NAMES,
  SUPPORTED_ENGINE_KEYS,
  SUPPORTED_ENGINE_VERSIONS,
  SUPPORTED_PSQL_VERSIONS
} from '../../src/constants/databaseRegistry';

describe('[Unit] - Database Registry Constants', () => {
  describe('ENGINE_POSTGRESQL', () => {
    test('is "postgresql"', () => {
      expect(ENGINE_POSTGRESQL).toBe('postgresql');
    });

    test('is lowercase', () => {
      expect(ENGINE_POSTGRESQL.toLowerCase()).toBe(ENGINE_POSTGRESQL);
    });
  });

  describe('ENGINE_POSTGRESQL_DISPLAY', () => {
    test('is "PostgreSQL"', () => {
      expect(ENGINE_POSTGRESQL_DISPLAY).toBe('PostgreSQL');
    });

    test('is properly capitalized', () => {
      expect(ENGINE_POSTGRESQL_DISPLAY).toMatch(/^[A-Z]/);
    });
  });

  describe('SUPPORTED_DATABASE_ENGINES', () => {
    test('contains postgresql', () => {
      expect(SUPPORTED_DATABASE_ENGINES).toContain(ENGINE_POSTGRESQL);
    });

    test('is an array', () => {
      expect(Array.isArray(SUPPORTED_DATABASE_ENGINES)).toBe(true);
    });

    test('has at least one engine', () => {
      expect(SUPPORTED_DATABASE_ENGINES.length).toBeGreaterThan(0);
    });

    test('all entries are strings', () => {
      for (const engine of SUPPORTED_DATABASE_ENGINES) {
        expect(typeof engine).toBe('string');
      }
    });
  });

  describe('SUPPORTED_ENGINE_DISPLAY_NAMES', () => {
    test('contains PostgreSQL', () => {
      expect(SUPPORTED_ENGINE_DISPLAY_NAMES).toContain(
        ENGINE_POSTGRESQL_DISPLAY
      );
    });

    test('has same length as SUPPORTED_DATABASE_ENGINES', () => {
      expect(SUPPORTED_ENGINE_DISPLAY_NAMES.length).toBe(
        SUPPORTED_DATABASE_ENGINES.length
      );
    });

    test('all entries are strings', () => {
      for (const name of SUPPORTED_ENGINE_DISPLAY_NAMES) {
        expect(typeof name).toBe('string');
      }
    });
  });

  describe('PSQL_VERSION_15_0', () => {
    test('is "v15.0"', () => {
      expect(PSQL_VERSION_15_0).toBe('v15.0');
    });

    test('starts with "v"', () => {
      expect(PSQL_VERSION_15_0).toMatch(/^v/);
    });

    test('contains version number', () => {
      expect(PSQL_VERSION_15_0).toMatch(/\d+\.\d+/);
    });
  });

  describe('SUPPORTED_PSQL_VERSIONS', () => {
    test('contains v15.0', () => {
      expect(SUPPORTED_PSQL_VERSIONS).toContain(PSQL_VERSION_15_0);
    });

    test('is an array', () => {
      expect(Array.isArray(SUPPORTED_PSQL_VERSIONS)).toBe(true);
    });

    test('has at least one version', () => {
      expect(SUPPORTED_PSQL_VERSIONS.length).toBeGreaterThan(0);
    });

    test('all entries start with "v"', () => {
      for (const version of SUPPORTED_PSQL_VERSIONS) {
        expect(version).toMatch(/^v/);
      }
    });
  });

  describe('SUPPORTED_ENGINE_VERSIONS', () => {
    test('has postgresql key', () => {
      expect(SUPPORTED_ENGINE_VERSIONS).toHaveProperty(ENGINE_POSTGRESQL);
    });

    test('postgresql versions match SUPPORTED_PSQL_VERSIONS', () => {
      expect(SUPPORTED_ENGINE_VERSIONS[ENGINE_POSTGRESQL]).toBe(
        SUPPORTED_PSQL_VERSIONS
      );
    });

    test('all engines have version arrays', () => {
      for (const engine of SUPPORTED_DATABASE_ENGINES) {
        expect(Array.isArray(SUPPORTED_ENGINE_VERSIONS[engine])).toBe(true);
      }
    });
  });

  describe('ENGINE_KEY_POSTGRESQL_15_0', () => {
    test('is "postgresql:v15.0"', () => {
      expect(ENGINE_KEY_POSTGRESQL_15_0).toBe('postgresql:v15.0');
    });

    test('is composed of engine and version', () => {
      expect(ENGINE_KEY_POSTGRESQL_15_0).toBe(
        `${ENGINE_POSTGRESQL}:${PSQL_VERSION_15_0}`
      );
    });

    test('contains colon separator', () => {
      expect(ENGINE_KEY_POSTGRESQL_15_0).toContain(':');
    });
  });

  describe('SUPPORTED_ENGINE_KEYS', () => {
    test('contains postgresql:v15.0', () => {
      expect(SUPPORTED_ENGINE_KEYS).toContain(ENGINE_KEY_POSTGRESQL_15_0);
    });

    test('is an array', () => {
      expect(Array.isArray(SUPPORTED_ENGINE_KEYS)).toBe(true);
    });

    test('has at least one key', () => {
      expect(SUPPORTED_ENGINE_KEYS.length).toBeGreaterThan(0);
    });

    test('all entries contain colon separator', () => {
      for (const key of SUPPORTED_ENGINE_KEYS) {
        expect(key).toContain(':');
      }
    });

    test('all entries follow engine:version format', () => {
      for (const key of SUPPORTED_ENGINE_KEYS) {
        expect(key).toMatch(/^[a-z]+:v\d+\.\d+$/);
      }
    });
  });

  describe('ENGINE_DISPLAY_NAMES', () => {
    test('maps postgresql to PostgreSQL', () => {
      expect(ENGINE_DISPLAY_NAMES[ENGINE_POSTGRESQL]).toBe(
        ENGINE_POSTGRESQL_DISPLAY
      );
    });

    test('has entry for each supported engine', () => {
      for (const engine of SUPPORTED_DATABASE_ENGINES) {
        expect(ENGINE_DISPLAY_NAMES).toHaveProperty(engine);
      }
    });

    test('all display names are non-empty strings', () => {
      for (const engine of SUPPORTED_DATABASE_ENGINES) {
        const displayName = ENGINE_DISPLAY_NAMES[engine];
        expect(typeof displayName).toBe('string');
        expect(displayName.length).toBeGreaterThan(0);
      }
    });
  });
});

describe('[Unit] - resolveEngineDisplayName', () => {
  describe('basic functionality', () => {
    test('resolves postgresql to PostgreSQL', () => {
      expect(resolveEngineDisplayName('postgresql')).toBe('PostgreSQL');
    });

    test('returns correct type', () => {
      const result = resolveEngineDisplayName('postgresql');
      expect(typeof result).toBe('string');
    });
  });

  describe('all supported engines', () => {
    test('resolves all supported engines', () => {
      for (const engine of SUPPORTED_DATABASE_ENGINES) {
        const displayName = resolveEngineDisplayName(engine);
        expect(displayName).toBeDefined();
        expect(typeof displayName).toBe('string');
      }
    });

    test('returns values matching ENGINE_DISPLAY_NAMES', () => {
      for (const engine of SUPPORTED_DATABASE_ENGINES) {
        const result = resolveEngineDisplayName(engine);
        expect(result).toBe(ENGINE_DISPLAY_NAMES[engine]);
      }
    });
  });

  describe('consistency', () => {
    test('returns consistent results for same input', () => {
      const result1 = resolveEngineDisplayName('postgresql');
      const result2 = resolveEngineDisplayName('postgresql');
      expect(result1).toBe(result2);
    });

    test('result is in SUPPORTED_ENGINE_DISPLAY_NAMES', () => {
      const result = resolveEngineDisplayName('postgresql');
      expect(SUPPORTED_ENGINE_DISPLAY_NAMES).toContain(result);
    });
  });
});
