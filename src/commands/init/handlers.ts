// Package imports
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as crypto from 'crypto';
import { password, confirm, input } from '@inquirer/prompts';
import { bold, cyan, dim } from 'picocolors';
import type z from 'zod';

// Project imports
import {
  BflooConfig_Schema,
  Config_SchemaSchema,
  Config_LocalKeyProp,
  Schema_Schema,
  SchemaApiKey_Schema,
  SchemaSnapshot_Schema,
  getManifestSchema
} from '$schemas';
import { CliError } from '$error';
import { ApiClient } from '$api';
import { printer } from '$ui';
import { ExecutionPlan } from '$execution';
import {
  findProjectRoot,
  getBflooDir,
  getConfigPath,
  readConfig,
  writeConfig,
  createInitialConfig,
  normalizeSchemaName,
  buildManifestFromSnapshots,
  writeManifest,
  getManifestPath,
  getSchemaSnapshotDir,
  getSnapshotFilename,
  writeStoredSnapshot,
  writeWorkingSnapshot,
  getSnapshotsDir,
  getWorkingSnapshotPath,
  findSchemaIdInManifests
} from '$fs';
import { PATHS, resolveEngineDisplayName } from '$constants';

/**
 * ### InitCmd_Options
 *
 * Options for the init command handler.
 *
 * Fields:
 * - `key` - API key for authentication (optional)
 * - `localKey` - Local identifier for the schema (optional)
 * - `reinit` - Whether to re-initialize and clear existing state
 * - `dir` - Directory for working schema files
 * - `yes` - Skip all confirmation prompts
 * - `dryRun` - Simulate actions without making changes
 * - `quiet` - Suppress all output except errors
 */
interface InitCmd_Options {
  key?: string | undefined;
  localKey?: string | undefined;
  reinit: boolean;
  dir: string;
  yes: boolean;
  dryRun: boolean;
  quiet: boolean;
}

/**
 * ### initCmd_Handler
 *
 * Initializes a bfloo project by fetching schema and snapshots from the API.
 *
 * Parameters:
 * - `options` - Init command options - see {@link InitCmd_Options}
 *   - `key` - API key for authentication (optional)
 *   - `localKey` - Local identifier for the schema (optional)
 *   - `reinit` - Whether to re-initialize and clear existing state
 *   - `dir` - Directory for working schema files
 *   - `yes` - Skip all confirmation prompts
 *   - `dryRun` - Simulate actions without making changes
 *   - `quiet` - Suppress all output except errors
 *
 * @throws `CliError` - When project is already initialized, API key is invalid, or user aborts
 */
export async function initCmd_Handler({
  key,
  localKey,
  reinit,
  dir,
  yes,
  dryRun,
  quiet
}: InitCmd_Options) {
  // Initialize execution plan at the start
  const plan: ExecutionPlan = new ExecutionPlan();

  // Warn if --yes is used
  if (yes && !quiet) {
    printer.warning(
      `Using ` +
        bold('--yes') +
        ` flag: all confirmation prompts will be skipped`
    );
  }

  // ─────────────────────────────────────────────────────────
  // Step 1: Check if project already initialized
  // ─────────────────────────────────────────────────────────
  const existingProject: string | null = findProjectRoot();
  const projectRoot: string = existingProject ?? process.cwd();
  const bflooDir: string = getBflooDir(projectRoot);
  const configPath: string = getConfigPath(projectRoot);

  if (existingProject && !reinit) {
    throw new CliError({
      title: 'Project already initialized',
      message: `Found existing bfloo project at ${existingProject}`,
      suggestions: [
        `To re-initialize, run with ${bold('--reinit / -r')} flag`,
        `To add another schema, use ${bold('bfloo add')} command`
      ]
    });
  }

  // ─────────────────────────────────────────────────────────
  // Step 1.1: Backup existing state for --reinit
  // ─────────────────────────────────────────────────────────
  if (existingProject && reinit) {
    addBackupSteps({ plan, projectRoot, bflooDir, configPath, quiet });
  }

  // ─────────────────────────────────────────────────────────
  // Step 1.2: Create .bfloo directory if not exists
  // ─────────────────────────────────────────────────────────
  if (!existingProject) {
    plan.add({
      name: 'Create .bfloo directory',
      exec: {
        action: () => {
          fs.mkdirSync(bflooDir, { recursive: true });
        },
        dryAction: () => {
          if (!quiet) printer.step(`Would create directory: ${bflooDir}`);
        }
      },
      rollback: {
        action: () => {
          fs.rmSync(bflooDir, { recursive: true });
        },
        failMsg: `Could not remove directory: ${bflooDir}`
      }
    });
  }

  // ─────────────────────────────────────────────────────────
  // Step 2: Get API key (from flag or prompt)
  // ─────────────────────────────────────────────────────────
  // Note: --quiet requires --key, so this block only runs in
  //       interactive mode
  // ─────────────────────────────────────────────────────────
  key ??= await promptForApiKey();

  // ─────────────────────────────────────────────────────────
  // Step 2.1: Validate API key format
  // ─────────────────────────────────────────────────────────
  const keyValidation: z.ZodSafeParseResult<
    z.infer<typeof SchemaApiKey_Schema>
  > = SchemaApiKey_Schema.safeParse(key);

  if (!keyValidation.success) {
    throw new CliError({
      title: 'Invalid API Key',
      message: `Provided API key "${key.slice(0, 10)}..." is not valid`,
      suggestions: [
        'The key did not pass format validation, please double-check and try again'
      ]
    });
  }

  // ─────────────────────────────────────────────────────────
  // Step 3: Fetch schema from API and confirm
  // ─────────────────────────────────────────────────────────
  const schema: z.infer<typeof Schema_Schema> = await fetchAndConfirmSchema({
    key: keyValidation.data,
    yes,
    quiet
  });

  // ─────────────────────────────────────────────────────────
  // Step 3.1: Check for schema ID collision (unless reinit)
  // ─────────────────────────────────────────────────────────
  if (!reinit) {
    const existingLocalKey = findSchemaIdInManifests(projectRoot, schema.id);
    if (existingLocalKey) {
      throw new CliError({
        title: 'Schema already exists',
        message: `This schema is already configured as "${existingLocalKey}"`,
        suggestions: [
          `Use ${bold('bfloo add')} to add a different schema`,
          `Use ${bold('bfloo init --reinit')} to start fresh`
        ]
      });
    }
  }

  // ─────────────────────────────────────────────────────────
  // Step 3.2: Get local key (from flag, prompt, or default)
  // ─────────────────────────────────────────────────────────
  const schemaKey: string = await resolveLocalKey({
    providedKey: localKey,
    schemaName: schema.name,
    yes,
    quiet
  });

  // ─────────────────────────────────────────────────────────
  // Step 4: Fetch schema snapshots
  // ─────────────────────────────────────────────────────────
  const snapshots: z.infer<typeof SchemaSnapshot_Schema>[] =
    await fetchSnapshots({
      key: keyValidation.data,
      quiet
    });

  // ─────────────────────────────────────────────────────────
  // Step 5: Prepare config and add write action to plan
  // ─────────────────────────────────────────────────────────
  const schemaDir: string = dir || PATHS.defaultSchemaDir;

  const schemaConfig: z.infer<typeof Config_SchemaSchema> = {
    dir: schemaDir,
    key: keyValidation.data,
    engine: resolveEngineDisplayName(schema.engine),
    envs: {}
  };

  const config: z.infer<typeof BflooConfig_Schema> = createInitialConfig(
    schemaKey,
    schemaConfig
  );

  addConfigStep({ plan, projectRoot, configPath, config, quiet });

  // ─────────────────────────────────────────────────────────
  // Step 6: Build manifest and add write action to plan
  // ─────────────────────────────────────────────────────────
  addManifestStep({
    plan,
    projectRoot,
    schemaKey,
    schemaId: schema.id,
    snapshots,
    quiet
  });

  // ─────────────────────────────────────────────────────────
  // Step 7: Write snapshot files (stored + working)
  // ─────────────────────────────────────────────────────────
  addSnapshotFilesStep({
    plan,
    projectRoot,
    schemaKey,
    schemaDir,
    schema,
    snapshots,
    quiet
  });

  // ─────────────────────────────────────────────────────────
  // Step 8: Execute the plan
  // ─────────────────────────────────────────────────────────
  await plan.run({ dry: dryRun });

  // ─────────────────────────────────────────────────────────
  // Step 9: Display result
  // ─────────────────────────────────────────────────────────
  if (!quiet) {
    printer.spacer();

    // Remind user to set up API key in environment variables
    if (!dryRun) {
      printer.warning(
        bold(
          'Make sure to add your API key to environment variables for secure access!'
        )
      );
      printer.spacer();
    }

    if (dryRun) {
      printer.info('Dry run complete - no changes were made');
    } else if (reinit) {
      printer.success('Project re-initialized successfully');
    } else {
      printer.success('Project initialized successfully');
    }
  }
}

/**
 * ### AddBackupStepsOptions
 *
 * Options for adding backup steps to the execution plan.
 *
 * Fields:
 * - `plan` - Execution plan to add steps to - see {@link ExecutionPlan}
 * - `projectRoot` - Root directory of the project
 * - `bflooDir` - Path to the .bfloo directory
 * - `configPath` - Path to the bfloo.yml config file
 * - `quiet` - Suppress output messages
 */
interface AddBackupStepsOptions {
  plan: ExecutionPlan;
  projectRoot: string;
  bflooDir: string;
  configPath: string;
  quiet: boolean;
}

/**
 * ### addBackupSteps
 *
 * Adds backup and clear steps to the execution plan for re-initialization.
 *
 * Parameters:
 * - `options` - Backup step options - see {@link AddBackupStepsOptions}
 *   - `plan` - Execution plan to add steps to
 *   - `projectRoot` - Root directory of the project
 *   - `bflooDir` - Path to the .bfloo directory
 *   - `configPath` - Path to the bfloo.yml config file
 *   - `quiet` - Suppress output messages
 */
function addBackupSteps({
  plan,
  projectRoot,
  bflooDir,
  configPath,
  quiet
}: AddBackupStepsOptions): void {
  // Create unique backup directory path
  const backupDir: string = path.join(
    os.tmpdir(),
    `bfloo-backup-${crypto.randomUUID()}`
  );

  // Read existing config to find working snapshot paths
  const existingConfig: z.infer<typeof BflooConfig_Schema> =
    readConfig(projectRoot);
  const schemaEntries: [string, z.infer<typeof Config_SchemaSchema>][] =
    Object.entries(existingConfig.schemas);

  // Collect all working snapshot paths that exist
  const workingSnapshotPaths: { src: string; dest: string }[] = [];
  for (const [schemaKey, schemaConfig] of schemaEntries) {
    const workingPath: string = getWorkingSnapshotPath(
      projectRoot,
      schemaConfig.dir,
      schemaKey
    );

    if (fs.existsSync(workingPath)) {
      // Preserve relative path structure in backup
      const relativePath: string = path.relative(projectRoot, workingPath);

      workingSnapshotPaths.push({
        src: workingPath,
        dest: path.join(backupDir, relativePath)
      });
    }
  }

  plan.add({
    name: 'Backup existing state',
    exec: {
      action: () => {
        // Create backup directory
        fs.mkdirSync(backupDir, { recursive: true });

        // Backup .bfloo directory
        if (fs.existsSync(bflooDir)) {
          fs.cpSync(bflooDir, path.join(backupDir, PATHS.bflooDir), {
            recursive: true
          });
        }

        // Backup bfloo.yml
        if (fs.existsSync(configPath)) {
          fs.cpSync(configPath, path.join(backupDir, PATHS.configFile));
        }

        // Backup working snapshots
        for (const { src, dest } of workingSnapshotPaths) {
          fs.mkdirSync(path.dirname(dest), { recursive: true });
          fs.cpSync(src, dest);
        }
      },
      dryAction: () => {
        if (!quiet) {
          printer.step(`Would backup .bfloo/ directory`);
          printer.step(`Would backup bfloo.yml`);

          if (workingSnapshotPaths.length > 0) {
            printer.step(
              `Would backup ${String(workingSnapshotPaths.length)} working snapshot(s)`
            );
          }
        }
      },
      onPlanSuccess: () => {
        // Clean up backup on success
        if (fs.existsSync(backupDir)) fs.rmSync(backupDir, { recursive: true });
      }
    },
    rollback: {
      action: () => {
        if (!fs.existsSync(backupDir)) return;

        // Restore .bfloo directory
        const backupBflooDir = path.join(backupDir, PATHS.bflooDir);

        if (fs.existsSync(backupBflooDir)) {
          if (fs.existsSync(bflooDir)) fs.rmSync(bflooDir, { recursive: true });

          fs.cpSync(backupBflooDir, bflooDir, { recursive: true });
        }

        // Restore bfloo.yml
        const backupConfigPath = path.join(backupDir, PATHS.configFile);

        if (fs.existsSync(backupConfigPath)) {
          fs.cpSync(backupConfigPath, configPath);
        }

        // Restore working snapshots
        for (const { src, dest } of workingSnapshotPaths) {
          if (fs.existsSync(dest)) {
            fs.mkdirSync(path.dirname(src), { recursive: true });
            fs.cpSync(dest, src);
          }
        }

        // Clean up backup directory after restore
        fs.rmSync(backupDir, { recursive: true });
      },
      failMsg: `Could not restore from backup: ${backupDir}`
    }
  });

  // Add step to clear existing state before writing new state
  plan.add({
    name: 'Clear existing state',
    exec: {
      action: () => {
        // Remove .bfloo directory contents (but keep directory)
        if (fs.existsSync(bflooDir)) {
          fs.rmSync(bflooDir, { recursive: true });
          fs.mkdirSync(bflooDir, { recursive: true });
        }

        // Remove existing working snapshots
        for (const { src } of workingSnapshotPaths) {
          if (fs.existsSync(src)) fs.unlinkSync(src);
        }
      },
      dryAction: () => {
        if (!quiet) {
          printer.step(`Would clear existing .bfloo/ directory`);
          if (workingSnapshotPaths.length > 0) {
            printer.step(
              `Would remove ${String(workingSnapshotPaths.length)} existing working snapshot(s)`
            );
          }
        }
      }
    },
    rollback: {
      // Rollback handled by backup restore step
      action: () => {
        // noop - rollback handled by backup restore step
      },
      failMsg: 'Could not clear existing state'
    }
  });
}

/**
 * ### promptForApiKey
 *
 * Prompts the user to enter their API key interactively.
 *
 * @returns `Promise<string>` - The entered API key
 */
async function promptForApiKey(): Promise<string> {
  printer.spacer();
  printer.header('🔐 Authentication');
  printer.text(
    dim('Enter API key to import schema & snapshots from remote'),
    3
  );

  return await password({
    message: cyan('API Key'),
    mask: '•',
    theme: {
      prefix: '   ',
      style: {
        message: (text: string) => bold(text),
        answer: (text: string) => dim(text)
      }
    }
  });
}

/**
 * ### FetchAndConfirmSchemaOptions
 *
 * Options for fetching and confirming a schema.
 *
 * Fields:
 * - `key` - API key for authentication - see {@link SchemaApiKey_Schema}
 * - `yes` - Skip confirmation prompt
 * - `quiet` - Suppress output messages
 */
interface FetchAndConfirmSchemaOptions {
  key: z.infer<typeof SchemaApiKey_Schema>;
  yes: boolean;
  quiet: boolean;
}

/**
 * ### fetchAndConfirmSchema
 *
 * Fetches schema from the API and confirms with the user.
 *
 * Parameters:
 * - `options` - Fetch options - see {@link FetchAndConfirmSchemaOptions}
 *   - `key` - API key for authentication
 *   - `yes` - Skip confirmation prompt
 *   - `quiet` - Suppress output messages
 *
 * @returns `Promise<Schema>` - The confirmed schema - see {@link Schema_Schema}
 *
 * @throws `CliError` - When user aborts confirmation
 */
async function fetchAndConfirmSchema({
  key,
  yes,
  quiet
}: FetchAndConfirmSchemaOptions): Promise<z.infer<typeof Schema_Schema>> {
  // Fetch schema from API
  let schema: z.infer<typeof Schema_Schema>;

  if (quiet) {
    schema = await ApiClient.schema.getByApiKey({ key });
  } else {
    printer.spacer();
    schema = await printer.withSpinner(ApiClient.schema.getByApiKey({ key }), {
      start: 'Fetching schema from remote...',
      success: 'Schema fetched successfully',
      fail: 'Failed to fetch schema'
    });
  }

  // Display schema details
  if (!quiet) {
    printer.header('Schema Details');
    printer.keyValue('Name', schema.name);
    printer.keyValue('Engine', resolveEngineDisplayName(schema.engine));
    printer.spacer();
  }

  // Confirm schema is correct (--quiet requires --yes, so this only runs in interactive mode)
  if (!yes) {
    const confirmed: boolean = await confirm({
      message: cyan('Is the above information correct?'),
      default: true,
      theme: {
        prefix: '   ',
        style: {
          message: (text: string) => bold(text)
        }
      }
    });

    if (!confirmed) {
      throw new CliError({
        title: 'Schema Initialization Aborted',
        message:
          'The schema initialization process has been cancelled by the user'
      });
    }
  }

  return schema;
}

/**
 * ### FetchSnapshotsOptions
 *
 * Options for fetching snapshots.
 *
 * Fields:
 * - `key` - API key for authentication - see {@link SchemaApiKey_Schema}
 * - `quiet` - Suppress output messages
 */
interface FetchSnapshotsOptions {
  key: z.infer<typeof SchemaApiKey_Schema>;
  quiet: boolean;
}

/**
 * ### fetchSnapshots
 *
 * Fetches all schema snapshots from the API.
 *
 * Parameters:
 * - `options` - Fetch options - see {@link FetchSnapshotsOptions}
 *   - `key` - API key for authentication
 *   - `quiet` - Suppress output messages
 *
 * @returns `Promise<SchemaSnapshot[]>` - Array of snapshots - see {@link SchemaSnapshot_Schema}
 */
async function fetchSnapshots({
  key,
  quiet
}: FetchSnapshotsOptions): Promise<z.infer<typeof SchemaSnapshot_Schema>[]> {
  let snapshots: z.infer<typeof SchemaSnapshot_Schema>[];

  if (quiet) {
    snapshots = await ApiClient.schemaSnapshot.listByApiKey({ key });
  } else {
    printer.spacer();
    snapshots = await printer.withSpinner(
      ApiClient.schemaSnapshot.listByApiKey({ key }),
      {
        start: 'Fetching snapshots from remote...',
        success: 'Snapshots fetched successfully',
        fail: 'Failed to fetch snapshots'
      }
    );
  }

  return snapshots;
}

/**
 * ### ResolveLocalKeyOptions
 *
 * Options for resolving the local schema key.
 *
 * Fields:
 * - `providedKey` - Key provided via flag (optional)
 * - `schemaName` - Name of the schema for default key generation
 * - `yes` - Skip interactive prompt and use default
 * - `quiet` - Suppress output messages
 */
interface ResolveLocalKeyOptions {
  providedKey: string | undefined;
  schemaName: string;
  yes: boolean;
  quiet: boolean;
}

/**
 * ### resolveLocalKey
 *
 * Resolves the local key from flag, prompt, or default value.
 *
 * Parameters:
 * - `options` - Resolution options - see {@link ResolveLocalKeyOptions}
 *   - `providedKey` - Key provided via flag (optional)
 *   - `schemaName` - Name of the schema for default key generation
 *   - `yes` - Skip interactive prompt and use default
 *   - `quiet` - Suppress output messages
 *
 * @returns `Promise<string>` - The resolved local key
 *
 * @throws `CliError` - When provided key is invalid
 */
async function resolveLocalKey({
  providedKey,
  schemaName,
  yes,
  quiet
}: ResolveLocalKeyOptions): Promise<string> {
  const defaultKey: string = normalizeSchemaName(schemaName);

  // If key was provided via flag, validate and use it
  if (providedKey) {
    const validation = Config_LocalKeyProp.safeParse(providedKey);

    if (!validation.success) {
      throw new CliError({
        title: 'Invalid local key',
        message: `The provided local key "${providedKey}" is not valid`,
        suggestions: [
          'Local key can only contain lowercase letters, numbers, hyphens, underscores, and dots',
          'Local key cannot contain spaces and must be 1-64 characters'
        ]
      });
    }
    return validation.data;
  }

  // In quiet or yes mode, use the default key
  if (quiet || yes) {
    return defaultKey;
  }

  // Interactive prompt for local key
  printer.spacer();
  printer.header('Local Identifier');
  printer.text(
    dim(
      'Choose a local identifier for this schema (used in config and .bfloo/)'
    ),
    3
  );

  const key = await input({
    message: cyan('Local key'),
    default: defaultKey,
    validate: (value: string) => {
      const result = Config_LocalKeyProp.safeParse(value);

      if (!result.success) {
        return 'Only lowercase letters, numbers, hyphens, underscores, and dots allowed (no spaces)';
      }

      return true;
    },
    theme: {
      prefix: '   ',
      style: {
        message: (text: string) => bold(text),
        answer: (text: string) => cyan(text)
      }
    }
  });

  return key;
}

/**
 * ### AddConfigStepOptions
 *
 * Options for adding the config write step.
 *
 * Fields:
 * - `plan` - Execution plan to add steps to - see {@link ExecutionPlan}
 * - `projectRoot` - Root directory of the project
 * - `configPath` - Path to the bfloo.yml config file
 * - `config` - Config object to write - see {@link BflooConfig_Schema}
 * - `quiet` - Suppress output messages
 */
interface AddConfigStepOptions {
  plan: ExecutionPlan;
  projectRoot: string;
  configPath: string;
  config: z.infer<typeof BflooConfig_Schema>;
  quiet: boolean;
}

/**
 * ### addConfigStep
 *
 * Adds the config file write step to the execution plan.
 *
 * Parameters:
 * - `options` - Config step options - see {@link AddConfigStepOptions}
 *   - `plan` - Execution plan to add steps to
 *   - `projectRoot` - Root directory of the project
 *   - `configPath` - Path to the bfloo.yml config file
 *   - `config` - Config object to write
 *   - `quiet` - Suppress output messages
 */
function addConfigStep({
  plan,
  projectRoot,
  configPath,
  config,
  quiet
}: AddConfigStepOptions): void {
  plan.add({
    name: 'Write bfloo.yml',
    exec: {
      action: () => {
        writeConfig(projectRoot, config);
      },
      dryAction: () => {
        if (!quiet) printer.step(`Would write config to: ${configPath}`);
      }
    },
    rollback: {
      action: () => {
        fs.unlinkSync(configPath);
      },
      failMsg: `Could not delete config file: ${configPath}`
    }
  });
}

/**
 * ### AddManifestStepOptions
 *
 * Options for adding the manifest write step.
 *
 * Fields:
 * - `plan` - Execution plan to add steps to - see {@link ExecutionPlan}
 * - `projectRoot` - Root directory of the project
 * - `schemaKey` - Local key for the schema
 * - `schemaId` - Remote schema ID
 * - `snapshots` - Array of snapshots to build manifest from - see {@link SchemaSnapshot_Schema}
 * - `quiet` - Suppress output messages
 */
interface AddManifestStepOptions {
  plan: ExecutionPlan;
  projectRoot: string;
  schemaKey: string;
  schemaId: string;
  snapshots: z.infer<typeof SchemaSnapshot_Schema>[];
  quiet: boolean;
}

/**
 * ### addManifestStep
 *
 * Adds the manifest file write step to the execution plan.
 *
 * Parameters:
 * - `options` - Manifest step options - see {@link AddManifestStepOptions}
 *   - `plan` - Execution plan to add steps to
 *   - `projectRoot` - Root directory of the project
 *   - `schemaKey` - Local key for the schema
 *   - `schemaId` - Remote schema ID
 *   - `snapshots` - Array of snapshots to build manifest from
 *   - `quiet` - Suppress output messages
 */
function addManifestStep({
  plan,
  projectRoot,
  schemaKey,
  schemaId,
  snapshots,
  quiet
}: AddManifestStepOptions): void {
  const manifest: z.infer<ReturnType<typeof getManifestSchema>> =
    buildManifestFromSnapshots(schemaId, snapshots);
  const manifestPath: string = getManifestPath(projectRoot, schemaKey);
  const schemaSnapshotDir: string = getSchemaSnapshotDir(
    projectRoot,
    schemaKey
  );

  plan.add({
    name: 'Write manifest.yml',
    exec: {
      action: () => {
        writeManifest(projectRoot, schemaKey, manifest);
      },
      dryAction: () => {
        if (!quiet) {
          printer.step(`Would create directory: ${schemaSnapshotDir}`);
          printer.step(`Would write manifest to: ${manifestPath}`);
        }
      }
    },
    rollback: {
      action: () => {
        fs.rmSync(schemaSnapshotDir, { recursive: true });
      },
      failMsg: `Could not remove schema directory: ${schemaSnapshotDir}`
    }
  });
}

/**
 * ### AddSnapshotFilesStepOptions
 *
 * Options for adding the snapshot files write step.
 *
 * Fields:
 * - `plan` - Execution plan to add steps to - see {@link ExecutionPlan}
 * - `projectRoot` - Root directory of the project
 * - `schemaKey` - Local key for the schema
 * - `schemaDir` - Directory for working schema files
 * - `schema` - Schema data - see {@link Schema_Schema}
 * - `snapshots` - Array of snapshots to write - see {@link SchemaSnapshot_Schema}
 * - `quiet` - Suppress output messages
 */
interface AddSnapshotFilesStepOptions {
  plan: ExecutionPlan;
  projectRoot: string;
  schemaKey: string;
  schemaDir: string;
  schema: z.infer<typeof Schema_Schema>;
  snapshots: z.infer<typeof SchemaSnapshot_Schema>[];
  quiet: boolean;
}

/**
 * ### addSnapshotFilesStep
 *
 * Adds the snapshot files write step to the execution plan.
 *
 * Parameters:
 * - `options` - Snapshot step options - see {@link AddSnapshotFilesStepOptions}
 *   - `plan` - Execution plan to add steps to
 *   - `projectRoot` - Root directory of the project
 *   - `schemaKey` - Local key for the schema
 *   - `schemaDir` - Directory for working schema files
 *   - `schema` - Schema data
 *   - `snapshots` - Array of snapshots to write
 *   - `quiet` - Suppress output messages
 */
function addSnapshotFilesStep({
  plan,
  projectRoot,
  schemaKey,
  schemaDir,
  schema,
  snapshots,
  quiet
}: AddSnapshotFilesStepOptions): void {
  const snapshotsDir: string = getSnapshotsDir(projectRoot, schemaKey);
  const workingPath: string = getWorkingSnapshotPath(
    projectRoot,
    schemaDir,
    schemaKey
  );

  // Find current snapshot (most recent)
  const sortedSnapshots = [...snapshots].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
  const currentSnapshot = sortedSnapshots[0];

  if (!currentSnapshot) return;

  plan.add({
    name: 'Write snapshot files',
    exec: {
      action: () => {
        // Write stored snapshots (non-current)
        for (const snapshot of snapshots) {
          const isCurrent: boolean = snapshot.id === currentSnapshot.id;

          if (!isCurrent) {
            const filename: string = getSnapshotFilename(
              snapshot.createdAt,
              snapshot.label
            );

            writeStoredSnapshot(projectRoot, schemaKey, filename, {
              description: snapshot.description ?? undefined,
              tables: snapshot.data?.tables ?? []
            });
          }
        }

        // Write working snapshot (current)
        writeWorkingSnapshot(projectRoot, schemaDir, schemaKey, {
          schema: {
            name: schema.name,
            description: schema.description ?? undefined
          },
          snapshot: {
            label: currentSnapshot.label,
            'engine-version': currentSnapshot.engineVersion,
            description: currentSnapshot.description ?? undefined,
            tables: currentSnapshot.data?.tables ?? []
          }
        });
      },
      dryAction: () => {
        if (!quiet) {
          const storedCount: number = snapshots.length - 1;

          if (storedCount > 0) {
            printer.step(`Would create directory: ${snapshotsDir}`);
            printer.step(
              `Would write ${String(storedCount)} stored snapshot file(s)`
            );
          }
          printer.step(`Would write working snapshot to: ${workingPath}`);
        }
      }
    },
    rollback: {
      action: () => {
        // Remove snapshots directory if it exists
        if (fs.existsSync(snapshotsDir)) {
          fs.rmSync(snapshotsDir, { recursive: true });
        }
        // Remove working snapshot if it exists
        if (fs.existsSync(workingPath)) {
          fs.unlinkSync(workingPath);
        }
      },
      failMsg: `Could not remove snapshot files`
    }
  });
}
