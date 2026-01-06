// Package imports
import { Command, type OptionValues } from 'commander';

// Project imports
import * as commands from '$commands';
import { setVerbose, setJson } from '$error';

/**
 * ### cli
 *
 * Root CLI command instance for bfloo.
 * Manages database schemas like code with version control, team collaboration, and migrations.
 *
 * Global Options:
 * - `-v, --verbose` - Enable verbose output for debugging
 * - `--json` - Output errors in JSON format
 *
 * Subcommands:
 * - `init` - Initialize a new bfloo project - see {@link commands.init_Cmd}
 */
export const cli: Command = new Command('bfloo')
  .description(
    'Manage database schemas like code. Version control, team collaboration, and seamless migrations.'
  )
  .version('0.0.1')
  .option('-v, --verbose', 'Enable verbose output for debugging')
  .option('--json', 'Output errors in JSON format')
  .hook('preAction', (thisCommand: Command) => {
    const opts: OptionValues = thisCommand.opts();

    if (opts['verbose']) setVerbose(true);
    if (opts['json']) setJson(true);
  })
  .addCommand(commands.init_Cmd);
