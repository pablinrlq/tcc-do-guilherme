import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('../../src/services/realtime', () => ({
  subscribeRealtime: vi.fn(),
  joinRequestRoom: vi.fn(),
  leaveRequestRoom: vi.fn(),
}));

import { useRealtime, useRequestRoom } from '../../src/hooks/useRealtime';
import {
  joinRequestRoom,
  leaveRequestRoom,
  subscribeRealtime,
} from '../../src/services/realtime';

const unsubscribe = vi.fn();
let captured: ((p: any) => void) | null = null;

beforeEach(() => {
  vi.clearAllMocks();
  captured = null;
  (subscribeRealtime as any).mockImplementation((_e: string, fn: (p: any) => void) => {
    captured = fn;
    return unsubscribe;
  });
});

describe('useRealtime', () => {
  it('assina no mount e cancela no unmount', () => {
    const handler = vi.fn();
    const { unmount } = renderHook(() => useRealtime('chat:message', handler));
    expect(subscribeRealtime).toHaveBeenCalledWith('chat:message', expect.any(Function));
    captured!({ content: 'oi' });
    expect(handler).toHaveBeenCalledWith({ content: 'oi' });
    unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('usa sempre o handler mais recente sem reassinar (ref)', () => {
    const antigo = vi.fn();
    const novo = vi.fn();
    const { rerender } = renderHook(({ fn }) => useRealtime('chat:message', fn), {
      initialProps: { fn: antigo },
    });
    rerender({ fn: novo });
    expect(subscribeRealtime).toHaveBeenCalledTimes(1); // não reassinou
    captured!({ content: 'oi' });
    expect(antigo).not.toHaveBeenCalled();
    expect(novo).toHaveBeenCalledTimes(1);
  });

  it('trocar de evento reassina', () => {
    const handler = vi.fn();
    const { rerender } = renderHook(({ ev }: { ev: any }) => useRealtime(ev, handler), {
      initialProps: { ev: 'chat:message' as any },
    });
    rerender({ ev: 'request:updated' as any });
    expect(unsubscribe).toHaveBeenCalledTimes(1);
    expect(subscribeRealtime).toHaveBeenCalledTimes(2);
    expect((subscribeRealtime as any).mock.calls[1][0]).toBe('request:updated');
  });
});

describe('useRequestRoom', () => {
  it('entra na room no mount e sai no unmount', () => {
    const { unmount } = renderHook(() => useRequestRoom('r1'));
    expect(joinRequestRoom).toHaveBeenCalledWith('r1');
    unmount();
    expect(leaveRequestRoom).toHaveBeenCalledTimes(1);
  });

  it('sem id não entra em room nenhuma', () => {
    const { unmount } = renderHook(() => useRequestRoom(undefined));
    expect(joinRequestRoom).not.toHaveBeenCalled();
    unmount();
    expect(leaveRequestRoom).not.toHaveBeenCalled();
  });

  it('troca de id sai da room anterior e entra na nova', () => {
    const { rerender } = renderHook(({ id }: { id: string }) => useRequestRoom(id), {
      initialProps: { id: 'r1' },
    });
    rerender({ id: 'r2' });
    expect(leaveRequestRoom).toHaveBeenCalledTimes(1);
    expect(joinRequestRoom).toHaveBeenCalledWith('r2');
  });
});
