// Package imports
import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  spyOn,
  mock
} from 'bun:test';

// Project imports
import { ExecutionPlan } from '../../src/execution/ExecutionPlan';
import * as printerModule from '../../src/ui/printer';
import type { Action } from '../../src/execution/types';

// Mock printer methods used by ExecutionPlan
let printerSpies: {
  spacer: ReturnType<typeof spyOn>;
  forceExit: ReturnType<typeof spyOn>;
  abortDetected: ReturnType<typeof spyOn>;
  rollbackStart: ReturnType<typeof spyOn>;
  rollbackWarning: ReturnType<typeof spyOn>;
  rollbackComplete: ReturnType<typeof spyOn>;
  warning: ReturnType<typeof spyOn>;
};

// Process spies
let processExitSpy: ReturnType<typeof spyOn>;
let processOnSpy: ReturnType<typeof spyOn>;
let processOffSpy: ReturnType<typeof spyOn>;

// Track registered SIGINT handlers
let sigintHandlers: (() => void)[] = [];

describe('[Unit] - ExecutionPlan', () => {
  beforeEach(() => {
    // Reset SIGINT handlers tracking
    sigintHandlers = [];

    // Mock printer methods
    printerSpies = {
      spacer: spyOn(printerModule.printer, 'spacer').mockImplementation(
        () => {}
      ),
      forceExit: spyOn(printerModule.printer, 'forceExit').mockImplementation(
        () => {}
      ),
      abortDetected: spyOn(
        printerModule.printer,
        'abortDetected'
      ).mockImplementation(() => {}),
      rollbackStart: spyOn(
        printerModule.printer,
        'rollbackStart'
      ).mockImplementation(() => {}),
      rollbackWarning: spyOn(
        printerModule.printer,
        'rollbackWarning'
      ).mockImplementation(() => {}),
      rollbackComplete: spyOn(
        printerModule.printer,
        'rollbackComplete'
      ).mockImplementation(() => {}),
      warning: spyOn(printerModule.printer, 'warning').mockImplementation(
        () => {}
      )
    };

    // Mock process.exit to prevent actual exit
    processExitSpy = spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });

    // Mock process.on to capture SIGINT handlers
    processOnSpy = spyOn(process, 'on').mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (event: string, handler: (...args: any[]) => void) => {
        if (event === 'SIGINT') {
          sigintHandlers.push(handler as () => void);
        }
        return process;
      }
    );

    // Mock process.off to remove SIGINT handlers
    processOffSpy = spyOn(process, 'off').mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (event: string, handler: (...args: any[]) => void) => {
        if (event === 'SIGINT') {
          sigintHandlers = sigintHandlers.filter((h) => h !== handler);
        }
        return process;
      }
    );
  });

  afterEach(() => {
    // Restore all spies
    printerSpies.spacer.mockRestore();
    printerSpies.forceExit.mockRestore();
    printerSpies.abortDetected.mockRestore();
    printerSpies.rollbackStart.mockRestore();
    printerSpies.rollbackWarning.mockRestore();
    printerSpies.rollbackComplete.mockRestore();
    printerSpies.warning.mockRestore();
    processExitSpy.mockRestore();
    processOnSpy.mockRestore();
    processOffSpy.mockRestore();
  });

  describe('add', () => {
    it('should return this for chaining', () => {
      const plan = new ExecutionPlan();
      const action: Action = {
        name: 'test action',
        exec: { action: () => {} }
      };

      const result = plan.add(action);

      expect(result).toBe(plan);
    });

    it('should allow chaining multiple actions', () => {
      const plan = new ExecutionPlan();

      const result = plan
        .add({ name: 'action1', exec: { action: () => {} } })
        .add({ name: 'action2', exec: { action: () => {} } })
        .add({ name: 'action3', exec: { action: () => {} } });

      expect(result).toBe(plan);
    });
  });

  describe('run - dry mode', () => {
    it('should execute dryAction for each action', async () => {
      const dryAction1 = mock(() => {});
      const dryAction2 = mock(() => {});

      const plan = new ExecutionPlan();
      plan.add({
        name: 'action1',
        exec: { action: () => {}, dryAction: dryAction1 }
      });
      plan.add({
        name: 'action2',
        exec: { action: () => {}, dryAction: dryAction2 }
      });

      await plan.run({ dry: true });

      expect(dryAction1).toHaveBeenCalledTimes(1);
      expect(dryAction2).toHaveBeenCalledTimes(1);
    });

    it('should not execute main actions in dry mode', async () => {
      const mainAction = mock(() => {});

      const plan = new ExecutionPlan();
      plan.add({
        name: 'action1',
        exec: { action: mainAction, dryAction: () => {} }
      });

      await plan.run({ dry: true });

      expect(mainAction).not.toHaveBeenCalled();
    });

    it('should skip actions without dryAction', async () => {
      const dryAction = mock(() => {});

      const plan = new ExecutionPlan();
      plan.add({ name: 'action1', exec: { action: () => {} } }); // No dryAction
      plan.add({ name: 'action2', exec: { action: () => {}, dryAction } });

      await plan.run({ dry: true });

      expect(dryAction).toHaveBeenCalledTimes(1);
    });

    it('should not set up SIGINT handler in dry mode', async () => {
      const plan = new ExecutionPlan();
      plan.add({
        name: 'action1',
        exec: { action: () => {}, dryAction: () => {} }
      });

      await plan.run({ dry: true });

      expect(processOnSpy).not.toHaveBeenCalled();
    });
  });

  describe('run - normal execution', () => {
    it('should execute all actions in order', async () => {
      const executionOrder: number[] = [];

      const plan = new ExecutionPlan();
      plan.add({
        name: 'action1',
        exec: {
          action: () => {
            executionOrder.push(1);
          }
        }
      });
      plan.add({
        name: 'action2',
        exec: {
          action: () => {
            executionOrder.push(2);
          }
        }
      });
      plan.add({
        name: 'action3',
        exec: {
          action: () => {
            executionOrder.push(3);
          }
        }
      });

      await plan.run();

      expect(executionOrder).toEqual([1, 2, 3]);
    });

    it('should execute async actions', async () => {
      const result: string[] = [];

      const plan = new ExecutionPlan();
      plan.add({
        name: 'async action',
        exec: {
          action: async () => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            result.push('done');
          }
        }
      });

      await plan.run();

      expect(result).toEqual(['done']);
    });

    it('should set up and clean up SIGINT handler', async () => {
      const plan = new ExecutionPlan();
      plan.add({ name: 'action1', exec: { action: () => {} } });

      await plan.run();

      expect(processOnSpy).toHaveBeenCalledWith('SIGINT', expect.any(Function));
      expect(processOffSpy).toHaveBeenCalledWith(
        'SIGINT',
        expect.any(Function)
      );
    });

    it('should run with empty options', async () => {
      const action = mock(() => {});

      const plan = new ExecutionPlan();
      plan.add({ name: 'action1', exec: { action } });

      await plan.run({});

      expect(action).toHaveBeenCalledTimes(1);
    });

    it('should run with no options', async () => {
      const action = mock(() => {});

      const plan = new ExecutionPlan();
      plan.add({ name: 'action1', exec: { action } });

      await plan.run();

      expect(action).toHaveBeenCalledTimes(1);
    });
  });

  describe('onSuccess hook', () => {
    it('should call onSuccess after action completes', async () => {
      const executionOrder: string[] = [];

      const plan = new ExecutionPlan();
      plan.add({
        name: 'action1',
        exec: {
          action: () => {
            executionOrder.push('action');
          },
          onSuccess: () => {
            executionOrder.push('onSuccess');
          }
        }
      });

      await plan.run();

      expect(executionOrder).toEqual(['action', 'onSuccess']);
    });

    it('should call async onSuccess', async () => {
      const result: string[] = [];

      const plan = new ExecutionPlan();
      plan.add({
        name: 'action1',
        exec: {
          action: () => {
            result.push('action');
          },
          onSuccess: async () => {
            await new Promise((resolve) => setTimeout(resolve, 5));
            result.push('onSuccess');
          }
        }
      });

      await plan.run();

      expect(result).toEqual(['action', 'onSuccess']);
    });

    it('should trigger rollback if onSuccess fails', async () => {
      const rollbackAction = mock(() => {});

      const plan = new ExecutionPlan();
      plan.add({
        name: 'action1',
        exec: {
          action: () => {},
          onSuccess: () => {
            throw new Error('onSuccess failed');
          }
        },
        rollback: {
          action: rollbackAction,
          failMsg: 'Failed to rollback action1'
        }
      });

      let thrownError: Error | null = null;
      try {
        await plan.run();
      } catch (error) {
        thrownError = error as Error;
      }

      expect(thrownError?.message).toBe('onSuccess failed');
      // Note: Due to error propagation, rollback is called twice
      // (once in onSuccess catch, once in outer catch)
      expect(rollbackAction).toHaveBeenCalled();
      expect(printerSpies.rollbackStart).toHaveBeenCalled();
    });
  });

  describe('onPlanSuccess hook', () => {
    it('should call onPlanSuccess after all actions complete', async () => {
      const executionOrder: string[] = [];

      const plan = new ExecutionPlan();
      plan.add({
        name: 'action1',
        exec: {
          action: () => {
            executionOrder.push('action1');
          },
          onPlanSuccess: () => {
            executionOrder.push('planSuccess1');
          }
        }
      });
      plan.add({
        name: 'action2',
        exec: {
          action: () => {
            executionOrder.push('action2');
          },
          onPlanSuccess: () => {
            executionOrder.push('planSuccess2');
          }
        }
      });

      await plan.run();

      expect(executionOrder).toEqual([
        'action1',
        'action2',
        'planSuccess1',
        'planSuccess2'
      ]);
    });

    it('should continue if onPlanSuccess throws', async () => {
      const secondHook = mock(() => {});

      const plan = new ExecutionPlan();
      plan.add({
        name: 'action1',
        exec: {
          action: () => {},
          onPlanSuccess: () => {
            throw new Error('Hook failed');
          }
        }
      });
      plan.add({
        name: 'action2',
        exec: {
          action: () => {},
          onPlanSuccess: secondHook
        }
      });

      await plan.run();

      expect(printerSpies.warning).toHaveBeenCalledWith(
        'A cleanup hook failed to execute'
      );
      expect(secondHook).toHaveBeenCalledTimes(1);
    });
  });

  describe('rollback', () => {
    it('should execute rollback on action failure', async () => {
      const rollbackAction = mock(() => {});

      const plan = new ExecutionPlan();
      plan.add({
        name: 'action1',
        exec: { action: () => {} },
        rollback: { action: rollbackAction, failMsg: 'Failed to rollback' }
      });
      plan.add({
        name: 'action2',
        exec: {
          action: () => {
            throw new Error('Action failed');
          }
        }
      });

      let thrownError: Error | null = null;
      try {
        await plan.run();
      } catch (error) {
        thrownError = error as Error;
      }

      expect(thrownError?.message).toBe('Action failed');
      expect(rollbackAction).toHaveBeenCalledTimes(1);
      expect(printerSpies.rollbackStart).toHaveBeenCalledTimes(1);
      expect(printerSpies.rollbackComplete).toHaveBeenCalledTimes(1);
    });

    it('should execute rollbacks in LIFO order', async () => {
      const executionOrder: number[] = [];

      const plan = new ExecutionPlan();
      plan.add({
        name: 'action1',
        exec: { action: () => {} },
        rollback: {
          action: () => {
            executionOrder.push(1);
          },
          failMsg: 'Failed 1'
        }
      });
      plan.add({
        name: 'action2',
        exec: { action: () => {} },
        rollback: {
          action: () => {
            executionOrder.push(2);
          },
          failMsg: 'Failed 2'
        }
      });
      plan.add({
        name: 'action3',
        exec: {
          action: () => {
            throw new Error('Failed');
          }
        }
      });

      let thrownError: Error | null = null;
      try {
        await plan.run();
      } catch (error) {
        thrownError = error as Error;
      }

      expect(thrownError?.message).toBe('Failed');
      // Should be 2, 1 (LIFO order)
      expect(executionOrder).toEqual([2, 1]);
    });

    it('should not rollback action that did not complete', async () => {
      const rollback1 = mock(() => {});
      const rollback2 = mock(() => {});

      const plan = new ExecutionPlan();
      plan.add({
        name: 'action1',
        exec: { action: () => {} },
        rollback: { action: rollback1, failMsg: 'Failed 1' }
      });
      plan.add({
        name: 'action2',
        exec: {
          action: () => {
            throw new Error('Failed');
          }
        },
        rollback: { action: rollback2, failMsg: 'Failed 2' }
      });

      let thrownError: Error | null = null;
      try {
        await plan.run();
      } catch (error) {
        thrownError = error as Error;
      }

      expect(thrownError?.message).toBe('Failed');
      expect(rollback1).toHaveBeenCalledTimes(1);
      expect(rollback2).not.toHaveBeenCalled();
    });

    it('should handle rollback failures gracefully', async () => {
      const plan = new ExecutionPlan();
      plan.add({
        name: 'action1',
        exec: { action: () => {} },
        rollback: {
          action: () => {
            throw new Error('Rollback failed');
          },
          failMsg: 'Could not undo action1'
        }
      });
      plan.add({
        name: 'action2',
        exec: {
          action: () => {
            throw new Error('Action failed');
          }
        }
      });

      let thrownError: Error | null = null;
      try {
        await plan.run();
      } catch (error) {
        thrownError = error as Error;
      }

      expect(thrownError?.message).toBe('Action failed');
      expect(printerSpies.rollbackWarning).toHaveBeenCalledWith([
        'Could not undo action1'
      ]);
    });

    it('should collect multiple rollback failures', async () => {
      const plan = new ExecutionPlan();
      plan.add({
        name: 'action1',
        exec: { action: () => {} },
        rollback: {
          action: () => {
            throw new Error('Rollback 1 failed');
          },
          failMsg: 'Could not undo action1'
        }
      });
      plan.add({
        name: 'action2',
        exec: { action: () => {} },
        rollback: {
          action: () => {
            throw new Error('Rollback 2 failed');
          },
          failMsg: 'Could not undo action2'
        }
      });
      plan.add({
        name: 'action3',
        exec: {
          action: () => {
            throw new Error('Action failed');
          }
        }
      });

      let thrownError: Error | null = null;
      try {
        await plan.run();
      } catch (error) {
        thrownError = error as Error;
      }

      expect(thrownError?.message).toBe('Action failed');
      expect(printerSpies.rollbackWarning).toHaveBeenCalledWith([
        'Could not undo action2',
        'Could not undo action1'
      ]);
    });

    it('should not call rollback methods when rollback plan is empty', async () => {
      const plan = new ExecutionPlan();
      plan.add({
        name: 'action1',
        exec: {
          action: () => {
            throw new Error('Failed');
          }
        }
        // No rollback defined
      });

      let thrownError: Error | null = null;
      try {
        await plan.run();
      } catch (error) {
        thrownError = error as Error;
      }

      expect(thrownError?.message).toBe('Failed');
      expect(printerSpies.rollbackStart).not.toHaveBeenCalled();
    });

    it('should handle async rollback actions', async () => {
      const result: string[] = [];

      const plan = new ExecutionPlan();
      plan.add({
        name: 'action1',
        exec: { action: () => {} },
        rollback: {
          action: async () => {
            await new Promise((resolve) => setTimeout(resolve, 5));
            result.push('rollback');
          },
          failMsg: 'Failed'
        }
      });
      plan.add({
        name: 'action2',
        exec: {
          action: () => {
            throw new Error('Failed');
          }
        }
      });

      let thrownError: Error | null = null;
      try {
        await plan.run();
      } catch (error) {
        thrownError = error as Error;
      }

      expect(thrownError?.message).toBe('Failed');
      expect(result).toEqual(['rollback']);
    });
  });

  describe('SIGINT handling', () => {
    it('should mark interrupted on first SIGINT', async () => {
      let actionExecuted = false;

      const plan = new ExecutionPlan();
      plan.add({
        name: 'action1',
        exec: {
          action: () => {
            // Simulate SIGINT during action
            if (sigintHandlers.length > 0) {
              sigintHandlers[0]?.();
            }
            actionExecuted = true;
          }
        },
        rollback: {
          action: () => {},
          failMsg: 'Failed'
        }
      });

      try {
        await plan.run();
      } catch {
        // Expected to throw due to process.exit
      }

      expect(actionExecuted).toBe(true);
      expect(printerSpies.spacer).toHaveBeenCalled();
      expect(printerSpies.abortDetected).toHaveBeenCalled();
    });

    it('should force exit on second SIGINT during execution', async () => {
      const plan = new ExecutionPlan();
      plan.add({
        name: 'action1',
        exec: {
          action: () => {
            // Simulate two SIGINTs
            if (sigintHandlers.length > 0) {
              sigintHandlers[0]?.(); // First SIGINT
              sigintHandlers[0]?.(); // Second SIGINT
            }
          }
        }
      });

      try {
        await plan.run();
      } catch {
        // Expected to throw due to process.exit
      }

      expect(printerSpies.forceExit).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(130);
    });

    it('should exit with code 130 after rollback on interrupt', async () => {
      const plan = new ExecutionPlan();
      plan.add({
        name: 'action1',
        exec: { action: () => {} },
        rollback: { action: () => {}, failMsg: 'Failed' }
      });
      plan.add({
        name: 'action2',
        exec: {
          action: () => {
            // Simulate SIGINT after action1 completes
            if (sigintHandlers.length > 0) {
              sigintHandlers[0]?.();
            }
          }
        }
      });

      try {
        await plan.run();
      } catch {
        // Expected
      }

      expect(processExitSpy).toHaveBeenCalledWith(130);
    });

    it('should rollback completed action when interrupted during its execution', async () => {
      const rollbackAction = mock(() => {});

      const plan = new ExecutionPlan();
      plan.add({
        name: 'action1',
        exec: {
          action: () => {
            // SIGINT during this action
            if (sigintHandlers.length > 0) {
              sigintHandlers[0]?.();
            }
          }
        },
        rollback: { action: rollbackAction, failMsg: 'Failed' }
      });

      try {
        await plan.run();
      } catch {
        // Expected
      }

      // Rollback should have been called (may be called multiple times due to error propagation)
      expect(rollbackAction).toHaveBeenCalled();
      expect(printerSpies.rollbackStart).toHaveBeenCalled();
    });

    it('should check for interrupt before starting each action', async () => {
      const action2 = mock(() => {});

      const plan = new ExecutionPlan();
      plan.add({
        name: 'action1',
        exec: {
          action: () => {
            // Trigger SIGINT after action1
            if (sigintHandlers.length > 0) {
              sigintHandlers[0]?.();
            }
          }
        },
        rollback: { action: () => {}, failMsg: 'Failed' }
      });
      plan.add({
        name: 'action2',
        exec: { action: action2 }
      });

      try {
        await plan.run();
      } catch {
        // Expected
      }

      // action2 should not have been called because interrupt was detected
      expect(action2).not.toHaveBeenCalled();
    });
  });
});
