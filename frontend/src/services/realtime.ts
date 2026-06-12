/** Conexão em tempo real (socket.io): notificações, chat e status ao vivo. */
import { io, Socket } from 'socket.io-client';
import { getToken } from './api';

export type RealtimeEvent =
  | 'notification:new'
  | 'chat:message'
  | 'request:updated'
  | 'request:joined';

const EVENTS: RealtimeEvent[] = [
  'notification:new',
  'chat:message',
  'request:updated',
  'request:joined',
];

let socket: Socket | null = null;
// Vários assinantes por evento: cada componente React assina no mount e
// cancela no unmount (cleanup do useEffect via hook useRealtime).
const handlers = new Map<RealtimeEvent, Set<(payload: any) => void>>();
let currentRequestRoom: string | null = null;

/** Conecta ao servidor usando o JWT da sessão (no-op sem token ou já conectado). */
export function connectRealtime(): void {
  const token = getToken();
  if (!token || socket) return;

  socket = io('/', { auth: { token } });

  // Reconexões (queda de rede) reentram na room do chat aberta
  socket.on('connect', () => {
    if (currentRequestRoom) socket!.emit('request:join', currentRequestRoom);
  });

  for (const event of EVENTS) {
    socket.on(event, (payload: unknown) => {
      handlers.get(event)?.forEach((fn) => fn(payload));
    });
  }
}

export function disconnectRealtime(): void {
  socket?.disconnect();
  socket = null;
  currentRequestRoom = null;
}

/** Assina um evento em tempo real; retorna a função de cancelamento. */
export function subscribeRealtime(
  event: RealtimeEvent,
  handler: (payload: any) => void,
): () => void {
  let set = handlers.get(event);
  if (!set) {
    set = new Set();
    handlers.set(event, set);
  }
  set.add(handler);
  return () => {
    set.delete(handler);
  };
}

/** Entra na room de uma solicitação (chat ao vivo), saindo da anterior. */
export function joinRequestRoom(requestId: string): void {
  if (currentRequestRoom && currentRequestRoom !== requestId) {
    socket?.emit('request:leave', currentRequestRoom);
  }
  currentRequestRoom = requestId;
  socket?.emit('request:join', requestId);
}

export function leaveRequestRoom(): void {
  if (currentRequestRoom) {
    socket?.emit('request:leave', currentRequestRoom);
    currentRequestRoom = null;
  }
}
