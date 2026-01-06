// Package imports
import { describe, it, expect, beforeEach, afterEach, spyOn } from 'bun:test';
import * as fs from 'fs';
import type z from 'zod';

// Project imports
import {
  configExists,
  readConfig,
  writeConfig,
  createInitialConfig,
  normalizeSchemaName
} from '../../src/fs/config';
import type {
  BflooConfig_Schema,
  Config_SchemaSchema
} from '../../src/schemas';

// Valid API key format: sk_<uuidv4>_<64-char-hex-secret>
// Using a valid UUIDv4 format (version 4, variant 1)
const VALID_API_KEY =
  'sk_a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d_0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

// Helper to create valid schema config
function createSchemaConfig(
  overrides: Partial<z.infer<typeof Config_SchemaSchema>> = {}
): z.infer<typeof Config_SchemaSchema> {
  return {
    engine: 'PostgreSQL',
    key: VALID_API_KEY,
    dir: 'db-schemas',
    envs: {},
    ...overrides
  } as z.infer<typeof Config_SchemaSchema>;
}

// Helper to create valid config
function createConfig(
  overrides: Partial<z.infer<typeof BflooConfig_Schema>> = {}
): z.infer<typeof BflooConfig_Schema> {
  return {
    schemas: {
      'my-schema': createSchemaConfig()
    },
    ...overrides
  };
}

describe('[Unit] - configExists', () => {
  let existsSyncSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    existsSyncSpy = spyOn(fs, 'existsSync');
  });

  afterEach(() => {
    existsSyncSpy.mockRestore();
  });

  describe('Basic Functionality', () => {
    it('should return true when config file exists', () => {
      existsSyncSpy.mockReturnValue(true);

      const result = configExists('/projects/my-app');
      expect(result).toBe(true);
    });

    it('should return false when config file does not exist', () => {
      existsSyncSpy.mockReturnValue(false);

      const result = configExists('/projects/my-app');
      expect(result).toBe(false);
    });

    it('should check correct path', () => {
      existsSyncSpy.mockReturnValue(false);

      configExists('/projects/my-app');

      expect(existsSyncSpy).toHaveBeenCalledWith('/projects/my-app/bfloo.yml');
    });
  });
});

describe('[Unit] - readConfig', () => {
  let existsSyncSpy: ReturnType<typeof spyOn>;
  let readFileSyncSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    existsSyncSpy = spyOn(fs, 'existsSync');
    readFileSyncSpy = spyOn(fs, 'readFileSync');
  });

  afterEach(() => {
    existsSyncSpy.mockRestore();
    readFileSyncSpy.mockRestore();
  });

  describe('Basic Functionality', () => {
    it('should read and parse valid config', () => {
      const validYaml = `
schemas:
  my-schema:
    engine: PostgreSQL
    key: ${VALID_API_KEY}
    dir: db-schemas
    envs: {}
`;
      existsSyncSpy.mockReturnValue(true);
      readFileSyncSpy.mockReturnValue(validYaml);

      const result = readConfig('/projects/my-app');

      expect(result.schemas).toBeDefined();
      expect(result.schemas['my-schema']).toBeDefined();
      expect(result.schemas['my-schema']?.engine).toBe('PostgreSQL');
    });

    it('should apply default values', () => {
      const minimalYaml = `
schemas:
  my-schema:
    engine: PostgreSQL
    key: ${VALID_API_KEY}
`;
      existsSyncSpy.mockReturnValue(true);
      readFileSyncSpy.mockReturnValue(minimalYaml);

      const result = readConfig('/projects/my-app');

      // dir and envs should have defaults
      expect(result.schemas['my-schema']?.dir).toBe('db-schemas');
      expect(result.schemas['my-schema']?.envs).toEqual({});
    });
  });

  describe('Error Handling', () => {
    it('should throw CliError when config file not found', () => {
      existsSyncSpy.mockReturnValue(false);

      expect(() => readConfig('/projects/my-app')).toThrow(
        'Could not find configuration file'
      );
    });

    it('should throw CliError when config is invalid', () => {
      const invalidYaml = `
schemas:
  my-schema:
    engine: invalid-engine
    key: invalid
`;
      existsSyncSpy.mockReturnValue(true);
      readFileSyncSpy.mockReturnValue(invalidYaml);

      expect(() => readConfig('/projects/my-app')).toThrow(
        'config file has validation errors'
      );
    });

    it('should throw CliError for malformed YAML', () => {
      const malformedYaml = `
schemas:
  my-schema:
    - this: is
    not: valid
`;
      existsSyncSpy.mockReturnValue(true);
      readFileSyncSpy.mockReturnValue(malformedYaml);

      expect(() => readConfig('/projects/my-app')).toThrow(
        'config file has validation errors'
      );
    });
  });
});

describe('[Unit] - writeConfig', () => {
  let existsSyncSpy: ReturnType<typeof spyOn>;
  let writeFileSyncSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    existsSyncSpy = spyOn(fs, 'existsSync');
    writeFileSyncSpy = spyOn(fs, 'writeFileSync').mockImplementation(() => {});
  });

  afterEach(() => {
    existsSyncSpy.mockRestore();
    writeFileSyncSpy.mockRestore();
  });

  describe('Basic Functionality', () => {
    it('should write config to correct path', () => {
      const config = createConfig();

      writeConfig('/projects/my-app', config);

      expect(writeFileSyncSpy).toHaveBeenCalledWith(
        '/projects/my-app/bfloo.yml',
        expect.any(String),
        'utf-8'
      );
    });

    it('should write valid YAML', () => {
      const config = createConfig();

      writeConfig('/projects/my-app', config);

      const writtenContent = writeFileSyncSpy.mock.calls[0]?.[1] as string;
      expect(writtenContent).toContain('schemas:');
      expect(writtenContent).toContain('my-schema:');
      expect(writtenContent).toContain('engine: PostgreSQL');
    });

    it('should add spacing between schema entries', () => {
      const config = createConfig({
        schemas: {
          'schema-one': createSchemaConfig(),
          'schema-two': createSchemaConfig()
        }
      });

      writeConfig('/projects/my-app', config);

      const writtenContent = writeFileSyncSpy.mock.calls[0]?.[1] as string;
      // Should have blank line between schema entries
      expect(writtenContent).toContain('\n\n');
    });
  });
});

describe('[Unit] - createInitialConfig', () => {
  describe('Basic Functionality', () => {
    it('should create config with single schema', () => {
      const schemaConfig = createSchemaConfig();

      const result = createInitialConfig('my-schema', schemaConfig);

      expect(result.schemas).toBeDefined();
      expect(result.schemas['my-schema']).toBe(schemaConfig);
    });

    it('should use provided schema name as key', () => {
      const schemaConfig = createSchemaConfig();

      const result = createInitialConfig('custom-name', schemaConfig);

      expect(Object.keys(result.schemas)).toEqual(['custom-name']);
    });

    it('should have only one schema entry', () => {
      const schemaConfig = createSchemaConfig();

      const result = createInitialConfig('my-schema', schemaConfig);

      expect(Object.keys(result.schemas)).toHaveLength(1);
    });
  });
});

describe('[Unit] - normalizeSchemaName', () => {
  describe('Basic Functionality', () => {
    it('should lowercase the name', () => {
      expect(normalizeSchemaName('MySchema')).toBe('myschema');
      expect(normalizeSchemaName('MY_SCHEMA')).toBe('my_schema');
    });

    it('should replace spaces with underscores', () => {
      expect(normalizeSchemaName('my schema')).toBe('my_schema');
      expect(normalizeSchemaName('my  schema')).toBe('my_schema');
    });

    it('should remove special characters', () => {
      expect(normalizeSchemaName('my@schema!')).toBe('myschema');
      expect(normalizeSchemaName('my#$%schema')).toBe('myschema');
    });

    it('should preserve valid characters', () => {
      expect(normalizeSchemaName('my-schema')).toBe('my-schema');
      expect(normalizeSchemaName('my_schema')).toBe('my_schema');
      expect(normalizeSchemaName('my.schema')).toBe('my.schema');
      expect(normalizeSchemaName('schema123')).toBe('schema123');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string', () => {
      expect(normalizeSchemaName('')).toBe('');
    });

    it('should handle string with only special characters', () => {
      expect(normalizeSchemaName('@#$%')).toBe('');
    });

    it('should handle mixed case with special characters', () => {
      expect(normalizeSchemaName('My Schema @ Database!')).toBe(
        'my_schema__database'
      );
    });

    it('should handle consecutive spaces', () => {
      expect(normalizeSchemaName('my   schema')).toBe('my_schema');
    });

    it('should handle unicode characters', () => {
      expect(normalizeSchemaName('schéma')).toBe('schma');
    });
  });
});
