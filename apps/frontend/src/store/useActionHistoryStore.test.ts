import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useActionHistory } from './useActionHistoryStore';

describe('useActionHistory', () => {
  beforeEach(() => {
    useActionHistory.setState({ actions: [] });
  });

  it('starts with empty actions', () => {
    expect(useActionHistory.getState().actions).toEqual([]);
  });

  it('pushAction adds an action with generated id and timestamp', () => {
    useActionHistory.getState().pushAction({
      type: 'test:action',
      label: 'Test Action',
      description: 'A test action',
      undo: vi.fn(),
    });

    const actions = useActionHistory.getState().actions;
    expect(actions).toHaveLength(1);
    expect(actions[0].type).toBe('test:action');
    expect(actions[0].label).toBe('Test Action');
    expect(actions[0].id).toMatch(/^undo-/);
    expect(actions[0].timestamp).toBeGreaterThan(0);
  });

  it('pushAction adds multiple actions', () => {
    useActionHistory.getState().pushAction({ type: 'a', label: 'A', description: '', undo: vi.fn() });
    useActionHistory.getState().pushAction({ type: 'b', label: 'B', description: '', undo: vi.fn() });

    expect(useActionHistory.getState().actions).toHaveLength(2);
  });

  it('dismissAction removes action by id', () => {
    useActionHistory.getState().pushAction({ type: 'test', label: 'Test', description: '', undo: vi.fn() });
    const id = useActionHistory.getState().actions[0].id;
    useActionHistory.getState().dismissAction(id);
    expect(useActionHistory.getState().actions).toHaveLength(0);
  });

  it('clearAll removes all actions', () => {
    useActionHistory.getState().pushAction({ type: 'a', label: 'A', description: '', undo: vi.fn() });
    useActionHistory.getState().pushAction({ type: 'b', label: 'B', description: '', undo: vi.fn() });
    useActionHistory.getState().clearAll();
    expect(useActionHistory.getState().actions).toEqual([]);
  });

  it('executeUndo calls undo function and removes action', async () => {
    const undo = vi.fn();
    useActionHistory.getState().pushAction({ type: 'test', label: 'Test', description: '', undo });
    const id = useActionHistory.getState().actions[0].id;

    await useActionHistory.getState().executeUndo(id);
    expect(undo).toHaveBeenCalledOnce();
    expect(useActionHistory.getState().actions).toHaveLength(0);
  });

  it('executeUndo does nothing for non-existent id', async () => {
    await expect(useActionHistory.getState().executeUndo('nonexistent')).resolves.toBeUndefined();
  });

  it('executeUndo handles async undo errors gracefully', async () => {
    const undo = vi.fn().mockRejectedValue(new Error('Undo failed'));
    useActionHistory.getState().pushAction({ type: 'test', label: 'Test', description: '', undo });
    const id = useActionHistory.getState().actions[0].id;

    await expect(useActionHistory.getState().executeUndo(id)).resolves.toBeUndefined();
    expect(useActionHistory.getState().actions).toHaveLength(0);
  });

  it('generates unique ids for each action', () => {
    useActionHistory.getState().pushAction({ type: 'a', label: 'A', description: '', undo: vi.fn() });
    useActionHistory.getState().pushAction({ type: 'b', label: 'B', description: '', undo: vi.fn() });

    const actions = useActionHistory.getState().actions;
    expect(actions[0].id).toMatch(/^undo-/);
    expect(actions[1].id).toMatch(/^undo-/);
    expect(actions[0].id).not.toBe(actions[1].id);
  });
});
