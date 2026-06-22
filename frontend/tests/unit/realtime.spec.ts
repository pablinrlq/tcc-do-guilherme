import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('socket.io-client', () => ({ io: vi.fn() }));

import { io } from 'socket.io-client';
import {
  connectRealtime,
  disconnectRealtime,
  subscribeRealtime,
  joinRequestRoom,
  leaveRequestRoom,
} from '../../src/services/realtime';
import { setToken } from '../../src/services/api';

interface FakeSocket {
  on: ReturnType<typeof vi.fn>;
  emit: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  trigger: (event: string, payload?: unknown) => void;
}

function makeFakeSocket(): FakeSocket {
  const listeners = new Map<string, ((p?: unknown) => void)[]>();
  return {
    on: vi.fn((event: string, fn: (p?: unknown) => void) => {
      listeners.set(event, [...(listeners.get(event) ?? []), fn]);
    }),
    emit: vi.fn(),
    disconnect: vi.fn(),
    trigger(event: string, payload?: unknown) {
      (listeners.get(event) ?? []).forEach((fn) => fn(payload));
    },
  };
}

let fakeSocket: FakeSocket;
const unsubs: Array<() => void> = [];

/** Assina guardando o cancelamento para limpar o registry entre testes. */
function subscribe(event: Parameters<typeof subscribeRealtime>[0], fn: (p: any) => void) {
  const off = subscribeRealtime(event, fn);
  unsubs.push(off);
  return off;
}

beforeEach(() => {
  vi.clearAllMocks();
  disconnectRealtime(); // estado limpo entre testes
  unsubs.splice(0).forEach((off) => off());
  fakeSocket = makeFakeSocket();
  (io as any).mockReturnValue(fakeSocket);
  localStorage.clear();
});

describe('connectRealtime', () => {
  it('não conecta sem token de sessão', () => {
    connectRealtime();
    expect(io).not.toHaveBeenCalled();
  });

  it('conecta com o JWT no handshake e não duplica conexões', () => {
    setToken('tok123');
    connectRealtime();
    connectRealtime(); // já conectado → no-op
    expect(io).toHaveBeenCalledTimes(1);
    expect(io).toHaveBeenCalledWith('/', { auth: { token: 'tok123' } });
  });
});

describe('subscribeRealtime (registry de assinantes)', () => {
  it('despacha eventos para o assinante registrado', () => {
    setToken('tok');
    connectRealtime();
    const handler = vi.fn();
    subscribe('notification:new', handler);
    fakeSocket.trigger('notification:new', { link: '/x' });
    expect(handler).toHaveBeenCalledWith({ link: '/x' });
  });

  it('vários assinantes do mesmo evento recebem o payload', () => {
    setToken('tok');
    connectRealtime();
    const a = vi.fn();
    const b = vi.fn();
    subscribe('chat:message', a);
    subscribe('chat:message', b);
    fakeSocket.trigger('chat:message', { content: 'oi' });
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
  });

  it('cancelar a assinatura interrompe a entrega (cleanup de unmount)', () => {
    setToken('tok');
    connectRealtime();
    const handler = vi.fn();
    const off = subscribe('chat:message', handler);
    off();
    fakeSocket.trigger('chat:message', { content: 'oi' });
    expect(handler).not.toHaveBeenCalled();
  });

  it('eventos sem assinante registrado não quebram', () => {
    setToken('tok');
    connectRealtime();
    expect(() => fakeSocket.trigger('request:updated', { requestId: 'r1' })).not.toThrow();
  });
});

describe('rooms de solicitação', () => {
  it('joinRequestRoom emite request:join e troca de room emite request:leave', () => {
    setToken('tok');
    connectRealtime();

    joinRequestRoom('r1');
    expect(fakeSocket.emit).toHaveBeenCalledWith('request:join', 'r1');

    joinRequestRoom('r2'); // troca: sai da anterior
    expect(fakeSocket.emit).toHaveBeenCalledWith('request:leave', 'r1');
    expect(fakeSocket.emit).toHaveBeenCalledWith('request:join', 'r2');

    fakeSocket.emit.mockClear();
    joinRequestRoom('r2'); // mesma room: não emite leave
    expect(fakeSocket.emit).toHaveBeenCalledTimes(1);
    expect(fakeSocket.emit).toHaveBeenCalledWith('request:join', 'r2');
  });

  it('reconexão reentra na room atual; sem room não emite nada', () => {
    setToken('tok');
    connectRealtime();

    fakeSocket.trigger('connect'); // sem room atual → nada
    expect(fakeSocket.emit).not.toHaveBeenCalled();

    joinRequestRoom('r7');
    fakeSocket.emit.mockClear();
    fakeSocket.trigger('connect'); // reconectou → rejoin
    expect(fakeSocket.emit).toHaveBeenCalledWith('request:join', 'r7');
  });

  it('leaveRequestRoom emite apenas quando há room ativa', () => {
    setToken('tok');
    connectRealtime();

    leaveRequestRoom(); // sem room → no-op
    expect(fakeSocket.emit).not.toHaveBeenCalled();

    joinRequestRoom('r3');
    fakeSocket.emit.mockClear();
    leaveRequestRoom();
    expect(fakeSocket.emit).toHaveBeenCalledWith('request:leave', 'r3');

    fakeSocket.emit.mockClear();
    leaveRequestRoom(); // já saiu → no-op
    expect(fakeSocket.emit).not.toHaveBeenCalled();
  });

  it('join/leave sem conexão ativa não quebram', () => {
    expect(() => {
      joinRequestRoom('r1');
      joinRequestRoom('r2');
      leaveRequestRoom();
    }).not.toThrow();
  });
});

describe('disconnectRealtime', () => {
  it('desconecta, zera a room atual e permite reconectar', () => {
    setToken('tok');
    connectRealtime();
    joinRequestRoom('r1');

    const socketAntigo = fakeSocket;
    disconnectRealtime();
    expect(socketAntigo.disconnect).toHaveBeenCalled();

    // Room zerada: reconectar não reentra em room nenhuma
    fakeSocket = makeFakeSocket();
    (io as any).mockReturnValue(fakeSocket);
    connectRealtime();
    expect(io).toHaveBeenCalledTimes(2);
    fakeSocket.trigger('connect');
    expect(fakeSocket.emit).not.toHaveBeenCalled();
  });
});
