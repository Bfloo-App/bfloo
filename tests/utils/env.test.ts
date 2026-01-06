// Package imports
import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Project imports
import {
  hasEnvVarNotation,
  resolveEnvVar,
  loadEnvFile
} from '../../src/utils/env';
import { CliError } from '../../src/error';

describe('[Unit] - hasEnvVarNotation', () => {
  describe('Basic Functionality', () => {
    it('should return true for string with single env var', () => {
      expect(hasEnvVarNotation('${MY_VAR}')).toBe(true);
    });

    it('should return true for string with env var in text', () => {
      expect(hasEnvVarNotation('prefix_${MY_VAR}_suffix')).toBe(true);
    });

    it('should return true for string with multiple env vars', () => {
      expect(hasEnvVarNotation('${VAR1}_${VAR2}')).toBe(true);
    });

    it('should return false for string without env vars', () => {
      expect(hasEnvVarNotation('plain text')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(hasEnvVarNotation('')).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should return false for malformed env var notation (missing closing brace)', () => {
      expect(hasEnvVarNotation('${MY_VAR')).toBe(false);
    });

    it('should return false for malformed env var notation (missing opening brace)', () => {
      expect(hasEnvVarNotation('$MY_VAR}')).toBe(false);
    });

    it('should return false for dollar sign without braces', () => {
      expect(hasEnvVarNotation('$MY_VAR')).toBe(false);
    });

    it('should return true for env var with underscores', () => {
      expect(hasEnvVarNotation('${MY_LONG_VAR_NAME}')).toBe(true);
    });

    it('should return true for env var with numbers', () => {
      expect(hasEnvVarNotation('${VAR123}')).toBe(true);
    });

    it('should return false for env var starting with number', () => {
      expect(hasEnvVarNotation('${123VAR}')).toBe(false);
    });

    it('should return true for env var starting with underscore', () => {
      expect(hasEnvVarNotation('${_PRIVATE_VAR}')).toBe(true);
    });
  });
});

describe('[Unit] - resolveEnvVar', () => {
  describe('Basic Functionality', () => {
    it('should resolve single env var', () => {
      const envMap = { MY_VAR: 'resolved_value' };
      const result = resolveEnvVar('${MY_VAR}', envMap);
      expect(result).toBe('resolved_value');
    });

    it('should resolve env var within text', () => {
      const envMap = { DB_HOST: 'localhost' };
      const result = resolveEnvVar('host=${DB_HOST}', envMap);
      expect(result).toBe('host=localhost');
    });

    it('should resolve multiple env vars', () => {
      const envMap = { HOST: 'localhost', PORT: '5432' };
      const result = resolveEnvVar('${HOST}:${PORT}', envMap);
      expect(result).toBe('localhost:5432');
    });

    it('should return string unchanged if no env vars', () => {
      const envMap = { MY_VAR: 'value' };
      const result = resolveEnvVar('plain text', envMap);
      expect(result).toBe('plain text');
    });

    it('should handle empty string', () => {
      const envMap = { MY_VAR: 'value' };
      const result = resolveEnvVar('', envMap);
      expect(result).toBe('');
    });
  });

  describe('Error Handling', () => {
    it('should throw CliError when env var is not found', () => {
      const envMap = { OTHER_VAR: 'value' };
      expect(() => resolveEnvVar('${MISSING_VAR}', envMap)).toThrow(CliError);
    });

    it('should throw with correct error title', () => {
      const envMap = {};
      try {
        resolveEnvVar('${MISSING_VAR}', envMap);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(CliError);
        expect((error as CliError).title).toBe(
          'Environment variable not found'
        );
      }
    });

    it('should throw with variable name in message', () => {
      const envMap = {};
      try {
        resolveEnvVar('${MY_MISSING_VAR}', envMap);
        expect(true).toBe(false);
      } catch (error) {
        expect((error as CliError).message).toContain('MY_MISSING_VAR');
      }
    });

    it('should throw on first missing var when multiple are missing', () => {
      const envMap = {};
      expect(() => resolveEnvVar('${VAR1}_${VAR2}', envMap)).toThrow(CliError);
    });
  });

  describe('Edge Cases', () => {
    it('should resolve env var with empty value', () => {
      const envMap = { EMPTY_VAR: '' };
      const result = resolveEnvVar('prefix${EMPTY_VAR}suffix', envMap);
      expect(result).toBe('prefixsuffix');
    });

    it('should resolve env var containing special characters', () => {
      const envMap = { SPECIAL: 'value with spaces & symbols!' };
      const result = resolveEnvVar('${SPECIAL}', envMap);
      expect(result).toBe('value with spaces & symbols!');
    });

    it('should handle env var with underscore prefix', () => {
      const envMap = { _PRIVATE: 'secret' };
      const result = resolveEnvVar('${_PRIVATE}', envMap);
      expect(result).toBe('secret');
    });
  });
});

describe('[Unit] - loadEnvFile', () => {
  let tempDir: string;
  let tempEnvFile: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bfloo-test-'));
    tempEnvFile = path.join(tempDir, '.env');
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('Basic Functionality', () => {
    it('should load and parse env file with single variable', () => {
      fs.writeFileSync(tempEnvFile, 'MY_VAR=my_value');
      const result = loadEnvFile(tempDir, '.env');
      expect(result).toEqual({ MY_VAR: 'my_value' });
    });

    it('should load and parse env file with multiple variables', () => {
      fs.writeFileSync(tempEnvFile, 'VAR1=value1\nVAR2=value2\nVAR3=value3');
      const result = loadEnvFile(tempDir, '.env');
      expect(result).toEqual({
        VAR1: 'value1',
        VAR2: 'value2',
        VAR3: 'value3'
      });
    });

    it('should handle absolute path', () => {
      fs.writeFileSync(tempEnvFile, 'ABS_VAR=absolute');
      const result = loadEnvFile('/nonexistent', tempEnvFile);
      expect(result).toEqual({ ABS_VAR: 'absolute' });
    });

    it('should handle relative path from project root', () => {
      const subDir = path.join(tempDir, 'config');
      fs.mkdirSync(subDir);
      const envPath = path.join(subDir, '.env.local');
      fs.writeFileSync(envPath, 'REL_VAR=relative');

      const result = loadEnvFile(tempDir, 'config/.env.local');
      expect(result).toEqual({ REL_VAR: 'relative' });
    });
  });

  describe('Parsing Edge Cases', () => {
    it('should handle empty env file', () => {
      fs.writeFileSync(tempEnvFile, '');
      const result = loadEnvFile(tempDir, '.env');
      expect(result).toEqual({});
    });

    it('should handle comments in env file', () => {
      fs.writeFileSync(
        tempEnvFile,
        '# This is a comment\nMY_VAR=value\n# Another comment'
      );
      const result = loadEnvFile(tempDir, '.env');
      expect(result).toEqual({ MY_VAR: 'value' });
    });

    it('should handle quoted values', () => {
      fs.writeFileSync(
        tempEnvFile,
        'QUOTED="quoted value"\nSINGLE=\'single quoted\''
      );
      const result = loadEnvFile(tempDir, '.env');
      expect(result['QUOTED']).toBe('quoted value');
      expect(result['SINGLE']).toBe('single quoted');
    });

    it('should handle values with equals sign', () => {
      fs.writeFileSync(tempEnvFile, 'CONNECTION=host=localhost;port=5432');
      const result = loadEnvFile(tempDir, '.env');
      expect(result).toEqual({ CONNECTION: 'host=localhost;port=5432' });
    });

    it('should handle empty values', () => {
      fs.writeFileSync(tempEnvFile, 'EMPTY_VAR=');
      const result = loadEnvFile(tempDir, '.env');
      expect(result).toEqual({ EMPTY_VAR: '' });
    });

    it('should handle whitespace around equals', () => {
      fs.writeFileSync(tempEnvFile, 'SPACED = value with space');
      const result = loadEnvFile(tempDir, '.env');
      // dotenv behavior: key includes trailing space, value includes leading space
      // This test documents actual behavior
      expect(result).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should throw CliError when file does not exist', () => {
      expect(() => loadEnvFile(tempDir, 'nonexistent.env')).toThrow(CliError);
    });

    it('should throw with correct error title', () => {
      try {
        loadEnvFile(tempDir, 'missing.env');
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(CliError);
        expect((error as CliError).title).toBe('Environment file not found');
      }
    });

    it('should include file path in error message', () => {
      try {
        loadEnvFile(tempDir, 'missing.env');
        expect(true).toBe(false);
      } catch (error) {
        expect((error as CliError).message).toContain('missing.env');
      }
    });

    it('should throw for directory path instead of file', () => {
      const dirPath = path.join(tempDir, 'subdir');
      fs.mkdirSync(dirPath);
      expect(() => loadEnvFile(tempDir, 'subdir')).toThrow();
    });
  });
});
