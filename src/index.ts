// Package imports
import { cli } from './cli';

// Project imports
import { handleRootError } from '$error';

// Run the CLI
await cli.parseAsync().catch(handleRootError);
