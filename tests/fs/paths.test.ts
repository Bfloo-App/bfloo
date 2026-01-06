// Package imports
import { describe, it, expect, beforeEach, afterEach, spyOn } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';

// Project imports
import {
  findProjectRoot,
  getBflooDir,
  getConfigPath,
  getSchemaDir
} from '../../src/fs/paths';
import { PATHS } from '../../src/constants';

describe('[Unit] - findProjectRoot', () => {
  let existsSyncSpy: ReturnType<typeof spyOn>;
  let statSyncSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    existsSyncSpy = spyOn(fs, 'existsSync');
    statSyncSpy = spyOn(fs, 'statSync');
  });

  afterEach(() => {
    existsSyncSpy.mockRestore();
    statSyncSpy.mockRestore();
  });

  describe('Basic Functionality', () => {
    it('should find project root when config exists in start directory', () => {
      const startDir = '/projects/my-app';
      const configPath = path.join(startDir, PATHS.configFile);

      existsSyncSpy.mockImplementation((p: string) => p === configPath);
      statSyncSpy.mockReturnValue({ isFile: () => true } as fs.Stats);

      const result = findProjectRoot(startDir);
      expect(result).toBe(startDir);
    });

    it('should find project root in parent directory', () => {
      const projectRoot = '/projects/my-app';
      const startDir = '/projects/my-app/src/components';
      const configPath = path.join(projectRoot, PATHS.configFile);

      existsSyncSpy.mockImplementation((p: string) => p === configPath);
      statSyncSpy.mockReturnValue({ isFile: () => true } as fs.Stats);

      const result = findProjectRoot(startDir);
      expect(result).toBe(projectRoot);
    });

    it('should return null when no config file exists', () => {
      existsSyncSpy.mockReturnValue(false);

      const result = findProjectRoot('/projects/no-config');
      expect(result).toBeNull();
    });

    it('should use cwd when no startDir provided', () => {
      const cwd = process.cwd();
      const configPath = path.join(cwd, PATHS.configFile);

      existsSyncSpy.mockImplementation((p: string) => p === configPath);
      statSyncSpy.mockReturnValue({ isFile: () => true } as fs.Stats);

      const result = findProjectRoot();
      expect(result).toBe(cwd);
    });
  });

  describe('Edge Cases', () => {
    it('should not match directories named bfloo.yml', () => {
      const startDir = '/projects/my-app';
      const configPath = path.join(startDir, PATHS.configFile);

      existsSyncSpy.mockImplementation((p: string) => p === configPath);
      statSyncSpy.mockReturnValue({ isFile: () => false } as fs.Stats);

      const result = findProjectRoot(startDir);
      expect(result).toBeNull();
    });

    it('should check root directory', () => {
      const rootConfigPath = path.join('/', PATHS.configFile);

      existsSyncSpy.mockImplementation((p: string) => p === rootConfigPath);
      statSyncSpy.mockReturnValue({ isFile: () => true } as fs.Stats);

      const result = findProjectRoot('/some/deep/nested/path');
      expect(result).toBe('/');
    });

    it('should handle relative paths by resolving them', () => {
      const resolvedPath = path.resolve('./relative/path');
      const configPath = path.join(resolvedPath, PATHS.configFile);

      existsSyncSpy.mockImplementation((p: string) => p === configPath);
      statSyncSpy.mockReturnValue({ isFile: () => true } as fs.Stats);

      const result = findProjectRoot('./relative/path');
      expect(result).toBe(resolvedPath);
    });
  });
});

describe('[Unit] - getBflooDir', () => {
  describe('Basic Functionality', () => {
    it('should return path to .bfloo directory', () => {
      const projectRoot = '/projects/my-app';
      const result = getBflooDir(projectRoot);
      expect(result).toBe(path.join(projectRoot, PATHS.bflooDir));
    });

    it('should handle root directory', () => {
      const result = getBflooDir('/');
      expect(result).toBe(path.join('/', PATHS.bflooDir));
    });

    it('should handle paths with trailing slash consistently', () => {
      const result1 = getBflooDir('/projects/my-app');
      const result2 = getBflooDir('/projects/my-app/');
      // path.join normalizes trailing slashes
      expect(result1).toBe(result2);
    });
  });
});

describe('[Unit] - getConfigPath', () => {
  describe('Basic Functionality', () => {
    it('should return path to bfloo.yml config file', () => {
      const projectRoot = '/projects/my-app';
      const result = getConfigPath(projectRoot);
      expect(result).toBe(path.join(projectRoot, PATHS.configFile));
    });

    it('should handle root directory', () => {
      const result = getConfigPath('/');
      expect(result).toBe(path.join('/', PATHS.configFile));
    });
  });
});

describe('[Unit] - getSchemaDir', () => {
  describe('Basic Functionality', () => {
    it('should return full path to schema directory', () => {
      const projectRoot = '/projects/my-app';
      const schemaDir = 'db-schemas';
      const result = getSchemaDir(projectRoot, schemaDir);
      expect(result).toBe(path.join(projectRoot, schemaDir));
    });

    it('should handle nested schema directory paths', () => {
      const projectRoot = '/projects/my-app';
      const schemaDir = 'src/db/schemas';
      const result = getSchemaDir(projectRoot, schemaDir);
      expect(result).toBe(path.join(projectRoot, schemaDir));
    });

    it('should handle empty schemaDir', () => {
      const projectRoot = '/projects/my-app';
      const result = getSchemaDir(projectRoot, '');
      expect(result).toBe(projectRoot);
    });
  });
});
