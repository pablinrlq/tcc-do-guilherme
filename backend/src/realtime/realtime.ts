import type { Server } from 'socket.io';

/**
 * Facade de emissão de eventos em tempo real.
 *
 * Os services importam apenas estas funções — quando o servidor de socket
 * não foi inicializado (testes de integração HTTP, scripts), as emissões
 * viram no-ops e nenhuma lógica de negócio é afetada.
 */
let io: Server | null = null;

export function setIO(server: Server | null): void {
  io = server;
}

/** Emite um evento para todas as conexões de um usuário (room user:<id>). */
export function emitToUser(userId: string, event: string, payload?: unknown): void {
  io?.to(`user:${userId}`).emit(event, payload);
}

/** Emite o mesmo evento para vários usuários. */
export function emitToUsers(userIds: string[], event: string, payload?: unknown): void {
  for (const id of userIds) emitToUser(id, event, payload);
}

/** Emite um evento para quem está com a solicitação aberta (room request:<id>). */
export function emitToRequest(requestId: string, event: string, payload?: unknown): void {
  io?.to(`request:${requestId}`).emit(event, payload);
}
