// Package imports
import { describe, it, expect } from 'bun:test';

// Project imports
import { cli } from '../src/cli.js';

describe('[Unit] - cli', () => {
  describe('Command Structure', () => {
    it('should create a CLI with correct name', () => {
      expect(cli.name()).toBe('bfloo');
    });

    it('should have correct description', () => {
      expect(cli.description()).toContain('database schema management');
    });

    it('should have correct version', () => {
      expect(cli.version()).toBe('0.0.1');
    });
  });

  describe('Registered Commands', () => {
    it('should have init command registered', () => {
      const initCmd = cli.commands.find((cmd) => cmd.name() === 'init');
      expect(initCmd).toBeDefined();
    });

    it('should have exactly one command registered', () => {
      expect(cli.commands).toHaveLength(1);
    });
  });
});
