// Package imports
import { Command } from 'commander';

// Project imports
import { initCmd_Handler } from './handlers';
import { PATHS } from '$constants';
import { CliError } from '$error';

/**
 * ### init_CmdBase
 *
 * Base command definition for the init command with all options configured.
 */
const init_CmdBase = new Command('init')
  .description('Initialize bfloo with your API key')
  .option('-k, --key <KEY>', 'API key (skips interactive prompt)')
  .option(
    '-l, --local-key <KEY>',
    'Local identifier for the schema (defaults to normalized remote name)'
  )
  .option(
    '-r, --reinit',
    'Re-initialize bfloo (clears all schemas and snapshots)',
    false
  )
  .option(
    '-d, --dir <dir>',
    'Directory for working schema files',
    PATHS.defaultSchemaDir
  )
  .option(
    '-y, --yes',
    'Skip all confirmation prompts (use with caution)',
    false
  )
  .option('--dry-run', 'Simulate actions without making any changes', false)
  .option(
    '-q, --quiet',
    'Suppress all output except errors (requires --key and --yes)',
    false
  );

/**
 * ### init_Cmd
 *
 * Init command with validation hooks and action handler attached.
 */
export const init_Cmd = init_CmdBase
  .hook('preAction', (thisCommand: Command) => {
    const opts = thisCommand.opts();

    if (opts['quiet'] && (!opts['key'] || !opts['yes'])) {
      const missing: string[] = [];
      if (!opts['key']) missing.push('--key');
      if (!opts['yes']) missing.push('--yes');

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
  .action(initCmd_Handler);
