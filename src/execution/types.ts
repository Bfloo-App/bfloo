/**
 * ### ActionExec
 *
 * Execution configuration for an action in the execution plan.
 *
 * Fields:
 * - `action` - Main action function to execute
 * - `dryAction` - Action to run in dry-run mode (optional)
 * - `onSuccess` - Callback after successful action execution (optional)
 * - `onPlanSuccess` - Callback after entire plan succeeds (optional)
 */
export interface ActionExec {
  action: () => Promise<void> | void;
  dryAction?: () => unknown;
  onSuccess?: () => Promise<void> | void;
  onPlanSuccess?: () => Promise<void> | void;
}

/**
 * ### ActionRollback
 *
 * Rollback configuration for an action.
 *
 * Fields:
 * - `action` - Rollback function to undo the action
 * - `failMsg` - Message to display if rollback fails
 */
export interface ActionRollback {
  action: () => Promise<void> | void;
  failMsg: string;
}

/**
 * ### Action
 *
 * Complete action definition for the execution plan.
 *
 * Fields:
 * - `name` - Human-readable name for the action
 * - `exec` - Execution configuration - see {@link ActionExec}
 * - `rollback` - Rollback configuration (optional) - see {@link ActionRollback}
 */
export interface Action {
  name: string;
  exec: ActionExec;
  rollback?: ActionRollback;
}

/**
 * ### RunOptions
 *
 * Options for running the execution plan.
 *
 * Fields:
 * - `dry` - Run in dry-run mode without making changes (optional)
 */
export interface RunOptions {
  dry?: boolean | undefined;
}

/**
 * ### RollbackItem
 *
 * Internal representation of a rollback action in the rollback queue.
 *
 * Fields:
 * - `name` - Name of the action being rolled back
 * - `action` - Rollback function to execute
 * - `failMsg` - Message to display if rollback fails
 */
export interface RollbackItem {
  name: string;
  action: () => Promise<void> | void;
  failMsg: string;
}
