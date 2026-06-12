/** Hooks de tempo real: assinatura de eventos e room de solicitação. */
import { useEffect, useRef } from 'react';
import {
  joinRequestRoom,
  leaveRequestRoom,
  subscribeRealtime,
  type RealtimeEvent,
} from '../services/realtime';

/**
 * Assina um evento do socket enquanto o componente estiver montado.
 * O handler é mantido em ref para nunca ficar com closure desatualizada.
 */
export function useRealtime(event: RealtimeEvent, handler: (payload: any) => void): void {
  const ref = useRef(handler);
  ref.current = handler;

  useEffect(() => {
    return subscribeRealtime(event, (payload) => ref.current(payload));
  }, [event]);
}

/** Entra na room do chat de uma solicitação; sai automaticamente no unmount. */
export function useRequestRoom(requestId: string | undefined): void {
  useEffect(() => {
    if (!requestId) return;
    joinRequestRoom(requestId);
    return () => leaveRequestRoom();
  }, [requestId]);
}
