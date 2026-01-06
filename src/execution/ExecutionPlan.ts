// Project imports
import { printer } from '$ui';
import type { Action, RunOptions, RollbackItem } from './types';

/**
 * ### ExecutionPlan
 *
 * Manages a sequence of actions with rollback support and interrupt handling.
 */
export class ExecutionPlan {
  private actions: Action[] = [];
  private interrupted = false;
  private isRollingBack = false;
  private sigintHandler: (() => void) | null = null;

  /**
   * ### add
   *
   * Adds an action to the execution plan.
   *
   * Parameters:
   * - `action` - Action to add - see {@link Action}
   *
   * @returns `this` - The execution plan for chaining
   */
  add(action: Action): this {
    this.actions.push(action);
    return this;
  }

  /**
   * ### run
   *
   * Executes all actions in the plan.
   *
   * Parameters:
   * - `options` - Run options (optional) - see {@link RunOptions}
   *   - `dry` - Run in dry-run mode without making changes (optional)
   */
  async run(options: RunOptions = {}): Promise<void> {
    const { dry = false } = options;

    if (dry) {
      this.runDry();
      return;
    }

    await this.runNormal();
  }

  /**
   * ### runDry
   *
   * Executes all actions in dry-run mode without making changes.
   */
  private runDry(): void {
    for (const action of this.actions) {
      if (action.exec.dryAction) action.exec.dryAction();
    }
  }

  /**
   * ### setupSigintHandler
   *
   * Sets up the SIGINT handler for graceful interrupt handling.
   */
  private setupSigintHandler(): void {
    this.interrupted = false;
    this.isRollingBack = false;

    this.sigintHandler = () => {
      // Print newline to move past the ^C
      printer.spacer();

      if (this.isRollingBack) {
        // During rollback: force exit
        printer.forceExit();
        process.exit(130);
      }

      if (this.interrupted) {
        // Second interrupt during execution: force exit
        printer.forceExit();
        process.exit(130);
      }

      // First interrupt: mark and notify
      this.interrupted = true;
      printer.abortDetected();
    };

    process.on('SIGINT', this.sigintHandler);
  }

  /**
   * ### cleanupSigintHandler
   *
   * Removes the SIGINT handler after execution completes.
   */
  private cleanupSigintHandler(): void {
    if (this.sigintHandler) {
      process.off('SIGINT', this.sigintHandler);
      this.sigintHandler = null;
    }
  }

  /**
   * ### runNormal
   *
   * Executes all actions with rollback support and interrupt handling.
   */
  private async runNormal(): Promise<void> {
    const rollbackPlan: RollbackItem[] = [];
    const planSuccessHooks: (() => Promise<void> | void)[] = [];

    // Set up interrupt handler
    this.setupSigintHandler();

    try {
      for (const action of this.actions) {
        // Check if interrupted before starting next action
        if (this.interrupted) {
          await this.executeRollback(rollbackPlan);
          this.cleanupSigintHandler();
          process.exit(130);
        }

        try {
          // Execute the main action
          await action.exec.action();

          // Check if interrupted during action execution
          // Note: this.interrupted may be set by SIGINT handler during await
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          if (this.interrupted) {
            // Action completed but user wants to abort - rollback including this action
            if (action.rollback) {
              rollbackPlan.unshift({
                name: action.name,
                action: action.rollback.action,
                failMsg: action.rollback.failMsg
              });
            }

            await this.executeRollback(rollbackPlan);
            this.cleanupSigintHandler();
            process.exit(130);
          }

          // Register rollback (prepend for LIFO order)
          if (action.rollback) {
            rollbackPlan.unshift({
              name: action.name,
              action: action.rollback.action,
              failMsg: action.rollback.failMsg
            });
          }

          // Queue onPlanSuccess hook
          if (action.exec.onPlanSuccess) {
            planSuccessHooks.push(action.exec.onPlanSuccess);
          }

          // Run onSuccess immediately
          if (action.exec.onSuccess) {
            try {
              await action.exec.onSuccess();
            } catch (onSuccessError) {
              // onSuccess failed - trigger rollback
              await this.executeRollback(rollbackPlan);
              throw onSuccessError;
            }
          }
        } catch (execError) {
          // Action failed - rollback and rethrow
          await this.executeRollback(rollbackPlan);
          throw execError;
        }
      }

      // All actions succeeded - run plan success hooks (best-effort)
      await this.executePlanSuccessHooks(planSuccessHooks);
    } finally {
      this.cleanupSigintHandler();
    }
  }

  /**
   * ### executeRollback
   *
   * Executes the rollback plan in LIFO order.
   *
   * Parameters:
   * - `rollbackPlan` - Array of rollback items to execute - see {@link RollbackItem}
   */
  private async executeRollback(rollbackPlan: RollbackItem[]): Promise<void> {
    if (rollbackPlan.length === 0) return;

    this.isRollingBack = true;
    printer.rollbackStart();

    const failures: string[] = [];

    for (const item of rollbackPlan) {
      try {
        await item.action();
      } catch {
        failures.push(item.failMsg);
      }
    }

    this.isRollingBack = false;

    if (failures.length > 0) {
      printer.rollbackWarning(failures);
    } else {
      printer.rollbackComplete();
    }
  }

  /**
   * ### executePlanSuccessHooks
   *
   * Executes all queued plan success hooks after successful completion.
   *
   * Parameters:
   * - `hooks` - Array of hook functions to execute
   */
  private async executePlanSuccessHooks(
    hooks: (() => Promise<void> | void)[]
  ): Promise<void> {
    for (const hook of hooks) {
      try {
        await hook();
      } catch {
        printer.warning('A cleanup hook failed to execute');
      }
    }
  }
}
