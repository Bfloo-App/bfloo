// Package imports
import { describe, expect, test } from 'bun:test';

// Project imports
import { PATHS } from '../../src/constants/paths';

describe('[Unit] - PATHS', () => {
  describe('structure', () => {
    test('is an object', () => {
      expect(typeof PATHS).toBe('object');
      expect(PATHS).not.toBeNull();
    });

    test('has all required properties', () => {
      expect(PATHS).toHaveProperty('bflooDir');
      expect(PATHS).toHaveProperty('configFile');
      expect(PATHS).toHaveProperty('manifestFile');
      expect(PATHS).toHaveProperty('snapshotsDir');
      expect(PATHS).toHaveProperty('defaultSchemaDir');
    });

    test('all values are strings', () => {
      expect(typeof PATHS.bflooDir).toBe('string');
      expect(typeof PATHS.configFile).toBe('string');
      expect(typeof PATHS.manifestFile).toBe('string');
      expect(typeof PATHS.snapshotsDir).toBe('string');
      expect(typeof PATHS.defaultSchemaDir).toBe('string');
    });

    test('all values are non-empty', () => {
      expect(PATHS.bflooDir.length).toBeGreaterThan(0);
      expect(PATHS.configFile.length).toBeGreaterThan(0);
      expect(PATHS.manifestFile.length).toBeGreaterThan(0);
      expect(PATHS.snapshotsDir.length).toBeGreaterThan(0);
      expect(PATHS.defaultSchemaDir.length).toBeGreaterThan(0);
    });
  });

  describe('bflooDir', () => {
    test('is ".bfloo"', () => {
      expect(PATHS.bflooDir).toBe('.bfloo');
    });

    test('starts with dot (hidden directory)', () => {
      expect(PATHS.bflooDir).toMatch(/^\./);
    });

    test('does not contain path separators', () => {
      expect(PATHS.bflooDir).not.toContain('/');
      expect(PATHS.bflooDir).not.toContain('\\');
    });
  });

  describe('configFile', () => {
    test('is "bfloo.yml"', () => {
      expect(PATHS.configFile).toBe('bfloo.yml');
    });

    test('has .yml extension', () => {
      expect(PATHS.configFile).toMatch(/\.yml$/);
    });

    test('does not contain path separators', () => {
      expect(PATHS.configFile).not.toContain('/');
      expect(PATHS.configFile).not.toContain('\\');
    });
  });

  describe('manifestFile', () => {
    test('is "manifest.yml"', () => {
      expect(PATHS.manifestFile).toBe('manifest.yml');
    });

    test('has .yml extension', () => {
      expect(PATHS.manifestFile).toMatch(/\.yml$/);
    });

    test('does not contain path separators', () => {
      expect(PATHS.manifestFile).not.toContain('/');
      expect(PATHS.manifestFile).not.toContain('\\');
    });
  });

  describe('snapshotsDir', () => {
    test('is "snapshots"', () => {
      expect(PATHS.snapshotsDir).toBe('snapshots');
    });

    test('does not start with dot', () => {
      expect(PATHS.snapshotsDir).not.toMatch(/^\./);
    });

    test('does not contain path separators', () => {
      expect(PATHS.snapshotsDir).not.toContain('/');
      expect(PATHS.snapshotsDir).not.toContain('\\');
    });
  });

  describe('defaultSchemaDir', () => {
    test('is "db-schemas"', () => {
      expect(PATHS.defaultSchemaDir).toBe('db-schemas');
    });

    test('does not start with dot', () => {
      expect(PATHS.defaultSchemaDir).not.toMatch(/^\./);
    });

    test('does not contain path separators', () => {
      expect(PATHS.defaultSchemaDir).not.toContain('/');
      expect(PATHS.defaultSchemaDir).not.toContain('\\');
    });

    test('contains hyphen separator', () => {
      expect(PATHS.defaultSchemaDir).toContain('-');
    });
  });

  describe('path combinations', () => {
    test('can construct config file path in bfloo dir', () => {
      const configPath = `${PATHS.bflooDir}/${PATHS.configFile}`;
      expect(configPath).toBe('.bfloo/bfloo.yml');
    });

    test('can construct manifest file path in bfloo dir', () => {
      const manifestPath = `${PATHS.bflooDir}/${PATHS.manifestFile}`;
      expect(manifestPath).toBe('.bfloo/manifest.yml');
    });

    test('can construct snapshots dir path in bfloo dir', () => {
      const snapshotsPath = `${PATHS.bflooDir}/${PATHS.snapshotsDir}`;
      expect(snapshotsPath).toBe('.bfloo/snapshots');
    });
  });
});
