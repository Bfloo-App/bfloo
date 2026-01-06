// Package imports
import { describe, it, expect, beforeEach, afterEach, spyOn } from 'bun:test';
import { Command } from 'commander';

// Project imports
import { cli } from '../src/cli';
import * as errorModule from '../src/error/outputOptions';

// Type for accessing internal Commander.js lifecycle hooks
interface LifeCycleHooks {
  preAction?: ((cmd: Command) => void)[];
}

describe('[Unit] - cli', () => {
  describe('Command Structure', () => {
    it('should have correct name', () => {
      expect(cli.name()).toBe('bfloo');
    });

    it('should have correct description', () => {
      expect(cli.description()).toContain('database schemas');
      expect(cli.description()).toContain('Version control');
    });

    it('should have version 0.0.1', () => {
      expect(cli.version()).toBe('0.0.1');
    });

    it('should be an instance of Command', () => {
      expect(cli).toBeInstanceOf(Command);
    });
  });

  describe('Global Options', () => {
    it('should have verbose option with short flag -v', () => {
      const verboseOption = cli.options.find(
        (opt) => opt.short === '-v' || opt.long === '--verbose'
      );
      expect(verboseOption).toBeDefined();
      expect(verboseOption?.long).toBe('--verbose');
      expect(verboseOption?.short).toBe('-v');
    });

    it('should have json option', () => {
      const jsonOption = cli.options.find((opt) => opt.long === '--json');
      expect(jsonOption).toBeDefined();
      expect(jsonOption?.long).toBe('--json');
    });

    it('should have verbose option with correct description', () => {
      const verboseOption = cli.options.find((opt) => opt.long === '--verbose');
      expect(verboseOption?.description).toContain('verbose');
    });

    it('should have json option with correct description', () => {
      const jsonOption = cli.options.find((opt) => opt.long === '--json');
      expect(jsonOption?.description).toContain('JSON');
    });

    it('should have exactly 3 global options', () => {
      // --version (auto-added by Commander), --verbose, and --json
      expect(cli.options).toHaveLength(3);
    });

    it('should have version option (auto-added by Commander)', () => {
      const versionOption = cli.options.find((opt) => opt.long === '--version');
      expect(versionOption).toBeDefined();
    });
  });

  describe('Subcommands', () => {
    it('should have init subcommand registered', () => {
      const initCommand = cli.commands.find((cmd) => cmd.name() === 'init');
      expect(initCommand).toBeDefined();
    });

    it('should have at least one subcommand', () => {
      expect(cli.commands.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('preAction Hook - Registration', () => {
    it('should have preAction hooks registered', () => {
      const lifeCycleHooks = (
        cli as unknown as { _lifeCycleHooks: LifeCycleHooks }
      )._lifeCycleHooks;
      expect(lifeCycleHooks).toBeDefined();
      expect(lifeCycleHooks.preAction).toBeDefined();
      expect(lifeCycleHooks.preAction?.length).toBeGreaterThan(0);
    });
  });

  describe('preAction Hook - Behavior', () => {
    let setVerboseSpy: ReturnType<typeof spyOn>;
    let setJsonSpy: ReturnType<typeof spyOn>;

    beforeEach(() => {
      setVerboseSpy = spyOn(errorModule, 'setVerbose').mockImplementation(
        () => {}
      );
      setJsonSpy = spyOn(errorModule, 'setJson').mockImplementation(() => {});
    });

    afterEach(() => {
      setVerboseSpy.mockRestore();
      setJsonSpy.mockRestore();
    });

    it('should call setVerbose(true) when --verbose option is truthy', () => {
      const lifeCycleHooks = (
        cli as unknown as { _lifeCycleHooks: LifeCycleHooks }
      )._lifeCycleHooks;
      const preActionHook = lifeCycleHooks.preAction?.[0];
      expect(preActionHook).toBeDefined();

      // Create a mock command with verbose option
      const mockCommand = {
        opts: () => ({ verbose: true, json: false })
      } as Command;

      // Call the hook directly
      preActionHook?.(mockCommand);

      expect(setVerboseSpy).toHaveBeenCalledWith(true);
      expect(setJsonSpy).not.toHaveBeenCalled();
    });

    it('should call setJson(true) when --json option is truthy', () => {
      const lifeCycleHooks = (
        cli as unknown as { _lifeCycleHooks: LifeCycleHooks }
      )._lifeCycleHooks;
      const preActionHook = lifeCycleHooks.preAction?.[0];

      const mockCommand = {
        opts: () => ({ verbose: false, json: true })
      } as Command;

      preActionHook?.(mockCommand);

      expect(setJsonSpy).toHaveBeenCalledWith(true);
      expect(setVerboseSpy).not.toHaveBeenCalled();
    });

    it('should call both setVerbose and setJson when both options are truthy', () => {
      const lifeCycleHooks = (
        cli as unknown as { _lifeCycleHooks: LifeCycleHooks }
      )._lifeCycleHooks;
      const preActionHook = lifeCycleHooks.preAction?.[0];

      const mockCommand = {
        opts: () => ({ verbose: true, json: true })
      } as Command;

      preActionHook?.(mockCommand);

      expect(setVerboseSpy).toHaveBeenCalledWith(true);
      expect(setJsonSpy).toHaveBeenCalledWith(true);
    });

    it('should not call setVerbose or setJson when options are undefined', () => {
      const lifeCycleHooks = (
        cli as unknown as { _lifeCycleHooks: LifeCycleHooks }
      )._lifeCycleHooks;
      const preActionHook = lifeCycleHooks.preAction?.[0];

      const mockCommand = {
        opts: () => ({ verbose: undefined, json: undefined })
      } as Command;

      preActionHook?.(mockCommand);

      expect(setVerboseSpy).not.toHaveBeenCalled();
      expect(setJsonSpy).not.toHaveBeenCalled();
    });

    it('should not call setVerbose when verbose is false', () => {
      const lifeCycleHooks = (
        cli as unknown as { _lifeCycleHooks: LifeCycleHooks }
      )._lifeCycleHooks;
      const preActionHook = lifeCycleHooks.preAction?.[0];

      const mockCommand = {
        opts: () => ({ verbose: false, json: false })
      } as Command;

      preActionHook?.(mockCommand);

      expect(setVerboseSpy).not.toHaveBeenCalled();
      expect(setJsonSpy).not.toHaveBeenCalled();
    });

    it('should not call setJson when json is false', () => {
      const lifeCycleHooks = (
        cli as unknown as { _lifeCycleHooks: LifeCycleHooks }
      )._lifeCycleHooks;
      const preActionHook = lifeCycleHooks.preAction?.[0];

      const mockCommand = {
        opts: () => ({ verbose: false, json: false })
      } as Command;

      preActionHook?.(mockCommand);

      expect(setJsonSpy).not.toHaveBeenCalled();
    });
  });

  describe('Command Export', () => {
    it('should export cli as a Command instance', () => {
      expect(cli).toBeDefined();
      expect(typeof cli.name).toBe('function');
      expect(typeof cli.version).toBe('function');
      expect(typeof cli.parseAsync).toBe('function');
    });

    it('should be configurable with additional commands', () => {
      // Verify the addCommand method exists
      expect(typeof cli.addCommand).toBe('function');
    });

    it('should have hook method for adding lifecycle hooks', () => {
      expect(typeof cli.hook).toBe('function');
    });
  });
});
