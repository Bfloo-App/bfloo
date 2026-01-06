// Package imports
import { describe, it, expect, beforeEach, afterEach, spyOn } from 'bun:test';
import { Command } from 'commander';

// Project imports
import { init_Cmd } from '../../../src/commands/init/cmd';
import { CliError } from '../../../src/error/CliError';
import { PATHS } from '../../../src/constants/paths';

describe('[Unit] - init_Cmd', () => {
  describe('Command Structure', () => {
    it('should have correct command name', () => {
      expect(init_Cmd.name()).toBe('init');
    });

    it('should have correct description', () => {
      expect(init_Cmd.description()).toBe('Initialize bfloo with your API key');
    });

    it('should be an instance of Command', () => {
      expect(init_Cmd).toBeInstanceOf(Command);
    });
  });

  describe('Options', () => {
    it('should have --key option with short flag -k', () => {
      const option = init_Cmd.options.find((opt) => opt.long === '--key');

      expect(option).toBeDefined();
      expect(option?.short).toBe('-k');
      expect(option?.required).toBe(true); // <KEY> means required value
    });

    it('should have --local-key option with short flag -l', () => {
      const option = init_Cmd.options.find((opt) => opt.long === '--local-key');

      expect(option).toBeDefined();
      expect(option?.short).toBe('-l');
    });

    it('should have --reinit option with short flag -r', () => {
      const option = init_Cmd.options.find((opt) => opt.long === '--reinit');

      expect(option).toBeDefined();
      expect(option?.short).toBe('-r');
      expect(option?.defaultValue).toBe(false);
    });

    it('should have --dir option with short flag -d', () => {
      const option = init_Cmd.options.find((opt) => opt.long === '--dir');

      expect(option).toBeDefined();
      expect(option?.short).toBe('-d');
      expect(option?.defaultValue).toBe(PATHS.defaultSchemaDir);
    });

    it('should have --yes option with short flag -y', () => {
      const option = init_Cmd.options.find((opt) => opt.long === '--yes');

      expect(option).toBeDefined();
      expect(option?.short).toBe('-y');
      expect(option?.defaultValue).toBe(false);
    });

    it('should have --dry-run option', () => {
      const option = init_Cmd.options.find((opt) => opt.long === '--dry-run');

      expect(option).toBeDefined();
      expect(option?.defaultValue).toBe(false);
    });

    it('should have --quiet option with short flag -q', () => {
      const option = init_Cmd.options.find((opt) => opt.long === '--quiet');

      expect(option).toBeDefined();
      expect(option?.short).toBe('-q');
      expect(option?.defaultValue).toBe(false);
    });

    it('should have correct total number of options', () => {
      // --key, --local-key, --reinit, --dir, --yes, --dry-run, --quiet = 7
      expect(init_Cmd.options).toHaveLength(7);
    });
  });

  describe('Default Values', () => {
    it('should default --reinit to false', () => {
      const option = init_Cmd.options.find((opt) => opt.long === '--reinit');
      expect(option?.defaultValue).toBe(false);
    });

    it('should default --dir to PATHS.defaultSchemaDir', () => {
      const option = init_Cmd.options.find((opt) => opt.long === '--dir');
      expect(option?.defaultValue).toBe('db-schemas');
    });

    it('should default --yes to false', () => {
      const option = init_Cmd.options.find((opt) => opt.long === '--yes');
      expect(option?.defaultValue).toBe(false);
    });

    it('should default --dry-run to false', () => {
      const option = init_Cmd.options.find((opt) => opt.long === '--dry-run');
      expect(option?.defaultValue).toBe(false);
    });

    it('should default --quiet to false', () => {
      const option = init_Cmd.options.find((opt) => opt.long === '--quiet');
      expect(option?.defaultValue).toBe(false);
    });
  });

  describe('PreAction Hook - Quiet Mode Validation', () => {
    // Create a test command that mirrors init_Cmd's preAction hook
    // This tests the same validation logic without invoking the actual handler
    function createTestCommand(mockAction: () => void): Command {
      return new Command('init')
        .option('-k, --key <KEY>', 'API key')
        .option('-y, --yes', 'Skip prompts', false)
        .option('-q, --quiet', 'Quiet mode', false)
        .hook('preAction', (thisCommand: Command) => {
          const opts = thisCommand.opts<{
            quiet?: boolean;
            key?: string;
            yes?: boolean;
          }>();

          if (opts.quiet && (!opts.key || !opts.yes)) {
            const missing: string[] = [];
            if (!opts.key) missing.push('--key');
            if (!opts.yes) missing.push('--yes');

            throw new CliError({
              title: 'Invalid flag combination',
              message: `--quiet requires ${missing.join(' and ')} flag${missing.length > 1 ? 's' : ''}`,
              suggestions: [
                'Quiet mode cannot prompt for input or confirmation',
                'Usage: bfloo init --quiet --key <KEY> --yes'
              ]
            });
          }
        })
        .action(mockAction);
    }

    let consoleSpy: ReturnType<typeof spyOn>;

    beforeEach(() => {
      consoleSpy = spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should throw CliError when --quiet is used without --key', async () => {
      const cmd = createTestCommand(() => {});

      let thrownError: CliError | null = null;

      try {
        await cmd.parseAsync(['node', 'test', '--quiet']);
      } catch (error) {
        if (error instanceof CliError) {
          thrownError = error;
        }
      }

      expect(thrownError).toBeInstanceOf(CliError);
      expect(thrownError?.title).toBe('Invalid flag combination');
      expect(thrownError?.message).toContain('--key');
      expect(thrownError?.message).toContain('--yes');
    });

    it('should throw CliError when --quiet is used without --yes', async () => {
      const cmd = createTestCommand(() => {});

      let thrownError: CliError | null = null;

      try {
        await cmd.parseAsync(['node', 'test', '--quiet', '--key', 'test-key']);
      } catch (error) {
        if (error instanceof CliError) {
          thrownError = error;
        }
      }

      expect(thrownError).toBeInstanceOf(CliError);
      expect(thrownError?.message).toContain('--yes');
      expect(thrownError?.message).not.toContain('--key and');
    });

    it('should not throw when --quiet is used with both --key and --yes', async () => {
      let actionCalled = false;
      const cmd = createTestCommand(() => {
        actionCalled = true;
      });

      await cmd.parseAsync([
        'node',
        'test',
        '--quiet',
        '--key',
        'test-key',
        '--yes'
      ]);

      expect(actionCalled).toBe(true);
    });

    it('should not throw when --quiet is not used', async () => {
      let actionCalled = false;
      const cmd = createTestCommand(() => {
        actionCalled = true;
      });

      await cmd.parseAsync(['node', 'test']);

      expect(actionCalled).toBe(true);
    });

    it('should include proper suggestions in error', async () => {
      const cmd = createTestCommand(() => {});

      let thrownError: CliError | null = null;

      try {
        await cmd.parseAsync(['node', 'test', '--quiet']);
      } catch (error) {
        if (error instanceof CliError) {
          thrownError = error;
        }
      }

      expect(thrownError?.suggestions).toContain(
        'Quiet mode cannot prompt for input or confirmation'
      );
      expect(thrownError?.suggestions).toContain(
        'Usage: bfloo init --quiet --key <KEY> --yes'
      );
    });

    it('should correctly report only missing --yes when --key is provided', async () => {
      const cmd = createTestCommand(() => {});

      let thrownError: CliError | null = null;

      try {
        await cmd.parseAsync(['node', 'test', '-q', '-k', 'some-key']);
      } catch (error) {
        if (error instanceof CliError) {
          thrownError = error;
        }
      }

      expect(thrownError).toBeInstanceOf(CliError);
      expect(thrownError?.message).toBe('--quiet requires --yes flag');
    });

    it('should correctly report only missing --key when --yes is provided', async () => {
      const cmd = createTestCommand(() => {});

      let thrownError: CliError | null = null;

      try {
        await cmd.parseAsync(['node', 'test', '-q', '-y']);
      } catch (error) {
        if (error instanceof CliError) {
          thrownError = error;
        }
      }

      expect(thrownError).toBeInstanceOf(CliError);
      expect(thrownError?.message).toBe('--quiet requires --key flag');
    });

    it('should correctly report both missing flags', async () => {
      const cmd = createTestCommand(() => {});

      let thrownError: CliError | null = null;

      try {
        await cmd.parseAsync(['node', 'test', '-q']);
      } catch (error) {
        if (error instanceof CliError) {
          thrownError = error;
        }
      }

      expect(thrownError).toBeInstanceOf(CliError);
      expect(thrownError?.message).toBe(
        '--quiet requires --key and --yes flags'
      );
    });
  });

  describe('PreAction Hook - Verifying actual init_Cmd has hook', () => {
    it('should have preAction hooks registered', () => {
      // Access the internal _lifeCycleHooks to verify hook is registered
      interface LifeCycleHooks {
        preAction?: unknown[];
      }
      const lifeCycleHooks = (
        init_Cmd as unknown as { _lifeCycleHooks: LifeCycleHooks }
      )._lifeCycleHooks;
      expect(lifeCycleHooks).toBeDefined();
      expect(lifeCycleHooks.preAction).toBeDefined();
      expect(lifeCycleHooks.preAction?.length).toBeGreaterThan(0);
    });
  });

  describe('PreAction Hook - Actual init_Cmd Execution', () => {
    // These tests invoke the ACTUAL preAction hook from init_Cmd
    // They use a copy of init_Cmd to avoid polluting the original command state

    let consoleSpy: ReturnType<typeof spyOn>;
    let processExitSpy: ReturnType<typeof spyOn>;

    beforeEach(() => {
      consoleSpy = spyOn(console, 'error').mockImplementation(() => {});
      // Mock process.exit to prevent test from exiting
      processExitSpy = spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });
    });

    afterEach(() => {
      consoleSpy.mockRestore();
      processExitSpy.mockRestore();
    });

    it('should throw CliError from actual init_Cmd when --quiet without --key', async () => {
      // Create a fresh command that copies init_Cmd's hooks
      const testCmd = new Command('test-init')
        .option('-k, --key <KEY>', 'API key')
        .option('-y, --yes', 'Skip prompts', false)
        .option('-q, --quiet', 'Quiet mode', false);

      // Copy the preAction hook from init_Cmd
      const lifeCycleHooks = (
        init_Cmd as unknown as {
          _lifeCycleHooks: { preAction?: ((cmd: Command) => void)[] };
        }
      )._lifeCycleHooks;

      if (lifeCycleHooks.preAction?.[0]) {
        testCmd.hook('preAction', lifeCycleHooks.preAction[0]);
      }

      testCmd.action(() => {});

      let thrownError: CliError | null = null;

      try {
        await testCmd.parseAsync(['node', 'test', '--quiet']);
      } catch (error) {
        if (error instanceof CliError) {
          thrownError = error;
        }
      }

      expect(thrownError).toBeInstanceOf(CliError);
      expect(thrownError?.title).toBe('Invalid flag combination');
    });

    it('should throw CliError from actual init_Cmd when --quiet without --yes', async () => {
      const testCmd = new Command('test-init')
        .option('-k, --key <KEY>', 'API key')
        .option('-y, --yes', 'Skip prompts', false)
        .option('-q, --quiet', 'Quiet mode', false);

      const lifeCycleHooks = (
        init_Cmd as unknown as {
          _lifeCycleHooks: { preAction?: ((cmd: Command) => void)[] };
        }
      )._lifeCycleHooks;

      if (lifeCycleHooks.preAction?.[0]) {
        testCmd.hook('preAction', lifeCycleHooks.preAction[0]);
      }

      testCmd.action(() => {});

      let thrownError: CliError | null = null;

      try {
        await testCmd.parseAsync(['node', 'test', '--quiet', '--key', 'test']);
      } catch (error) {
        if (error instanceof CliError) {
          thrownError = error;
        }
      }

      expect(thrownError).toBeInstanceOf(CliError);
      expect(thrownError?.message).toContain('--yes');
    });

    it('should pass when --quiet is used with both --key and --yes', async () => {
      const testCmd = new Command('test-init')
        .option('-k, --key <KEY>', 'API key')
        .option('-y, --yes', 'Skip prompts', false)
        .option('-q, --quiet', 'Quiet mode', false);

      const lifeCycleHooks = (
        init_Cmd as unknown as {
          _lifeCycleHooks: { preAction?: ((cmd: Command) => void)[] };
        }
      )._lifeCycleHooks;

      if (lifeCycleHooks.preAction?.[0]) {
        testCmd.hook('preAction', lifeCycleHooks.preAction[0]);
      }

      let actionCalled = false;
      testCmd.action(() => {
        actionCalled = true;
      });

      await testCmd.parseAsync([
        'node',
        'test',
        '--quiet',
        '--key',
        'test',
        '--yes'
      ]);

      expect(actionCalled).toBe(true);
    });
  });
});
