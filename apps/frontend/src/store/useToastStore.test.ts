import { describe, it, expect, beforeEach } from 'vitest';
import { useToastStore, toast } from './useToastStore';

describe('useToastStore', () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
  });

  it('starts with empty toasts', () => {
    expect(useToastStore.getState().toasts).toEqual([]);
  });

  it('adds a toast with generated id', () => {
    useToastStore.getState().add({ type: 'success', title: 'Done!', duration: 4000 });
    const toasts = useToastStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0].title).toBe('Done!');
    expect(toasts[0].type).toBe('success');
    expect(toasts[0].id).toBeDefined();
  });

  it('adds a toast with optional message', () => {
    useToastStore.getState().add({ type: 'info', title: 'Info', message: 'Details', duration: 4000 });
    expect(useToastStore.getState().toasts[0].message).toBe('Details');
  });

  it('adds a toast with action', () => {
    const action = { label: 'Undo', onClick: () => {} };
    useToastStore.getState().add({ type: 'warning', title: 'Warning', duration: 4000, action });
    expect(useToastStore.getState().toasts[0].action?.label).toBe('Undo');
  });

  it('removes a toast by id', () => {
    useToastStore.getState().add({ type: 'success', title: 'Toast 1', duration: 4000 });
    useToastStore.getState().add({ type: 'error', title: 'Toast 2', duration: 5000 });
    const id = useToastStore.getState().toasts[0].id;
    useToastStore.getState().remove(id);
    expect(useToastStore.getState().toasts).toHaveLength(1);
    expect(useToastStore.getState().toasts[0].title).toBe('Toast 2');
  });

  it('updates action on a toast', () => {
    useToastStore.getState().add({ type: 'success', title: 'Test', duration: 4000 });
    const id = useToastStore.getState().toasts[0].id;
    const newAction = { label: 'Retry', onClick: () => {} };
    useToastStore.getState().updateAction(id, newAction);
    expect(useToastStore.getState().toasts[0].action?.label).toBe('Retry');
  });

  it('clears action when updateAction is called with undefined', () => {
    useToastStore.getState().add({ type: 'success', title: 'Test', duration: 4000, action: { label: 'Undo', onClick: () => {} } });
    const id = useToastStore.getState().toasts[0].id;
    useToastStore.getState().updateAction(id, undefined);
    expect(useToastStore.getState().toasts[0].action).toBeUndefined();
  });

  describe('imperative toast helper', () => {
    it('toast.success adds success toast with default duration 4000', () => {
      toast.success('Success!');
      expect(useToastStore.getState().toasts[0].type).toBe('success');
      expect(useToastStore.getState().toasts[0].duration).toBe(4000);
    });

    it('toast.error adds error toast with default duration 5000', () => {
      toast.error('Error!');
      expect(useToastStore.getState().toasts[0].type).toBe('error');
      expect(useToastStore.getState().toasts[0].duration).toBe(5000);
    });

    it('toast.info adds info toast with default duration 4000', () => {
      toast.info('Info!');
      expect(useToastStore.getState().toasts[0].type).toBe('info');
    });

    it('toast.warning adds warning toast with default duration 4500', () => {
      toast.warning('Warning!');
      expect(useToastStore.getState().toasts[0].type).toBe('warning');
      expect(useToastStore.getState().toasts[0].duration).toBe(4500);
    });

    it('toast methods accept custom duration as number', () => {
      toast.success('Slow', undefined, 10000);
      expect(useToastStore.getState().toasts[0].duration).toBe(10000);
    });

    it('toast methods accept duration with opts object', () => {
      toast.warning('Alert', 'Message', { duration: 6000 });
      expect(useToastStore.getState().toasts[0].duration).toBe(6000);
    });

    it('toast methods accept action in opts', () => {
      const action = { label: 'Undo', onClick: () => {} };
      toast.error('Failed', 'Something went wrong', { action });
      expect(useToastStore.getState().toasts[0].action?.label).toBe('Undo');
    });

    it('toast methods can include message', () => {
      toast.info('Update', 'New version available');
      expect(useToastStore.getState().toasts[0].message).toBe('New version available');
    });
  });
});
