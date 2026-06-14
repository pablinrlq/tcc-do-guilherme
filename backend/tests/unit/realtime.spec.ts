import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  setIO,
  emitToUser,
  emitToUsers,
  emitToRequest,
} from '../../src/realtime/realtime';

function makeFakeIO() {
  const emit = vi.fn();
  const to = vi.fn(() => ({ emit }));
  return { io: { to } as any, to, emit };
}

afterEach(() => {
  setIO(null);
});

describe('realtime facade', () => {
  it('emitToUser envia para a room user:<id>', () => {
    const { io, to, emit } = makeFakeIO();
    setIO(io);
    emitToUser('u1', 'notification:new', { link: '/x' });
    expect(to).toHaveBeenCalledWith('user:u1');
    expect(emit).toHaveBeenCalledWith('notification:new', { link: '/x' });
  });

  it('emitToUsers envia o mesmo evento para vários usuários', () => {
    const { io, to } = makeFakeIO();
    setIO(io);
    emitToUsers(['a', 'b'], 'request:updated', { requestId: 'r1' });
    expect(to).toHaveBeenCalledWith('user:a');
    expect(to).toHaveBeenCalledWith('user:b');
  });

  it('emitToRequest envia para a room request:<id>', () => {
    const { io, to, emit } = makeFakeIO();
    setIO(io);
    emitToRequest('r9', 'chat:message', { content: 'oi' });
    expect(to).toHaveBeenCalledWith('request:r9');
    expect(emit).toHaveBeenCalledWith('chat:message', { content: 'oi' });
  });

  it('vira no-op quando o servidor de socket não foi inicializado', () => {
    setIO(null);
    expect(() => {
      emitToUser('u1', 'evento');
      emitToUsers(['u1'], 'evento');
      emitToRequest('r1', 'evento');
    }).not.toThrow();
  });
});
