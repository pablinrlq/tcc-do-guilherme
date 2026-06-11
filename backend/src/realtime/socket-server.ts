import { Server } from 'socket.io';
import type { Server as HttpServer } from 'node:http';
import { env } from '../config/env';
import { prisma } from '../config/prisma';
import { verifyToken } from '../utils/jwt';
import { setIO } from './realtime';

/**
 * Inicializa o servidor de WebSocket (socket.io) sobre o servidor HTTP.
 *
 * Autenticação: o cliente envia o mesmo JWT da API em `auth.token` no
 * handshake. Conexões sem token válido ou de contas desativadas são
 * recusadas. Cada usuário entra na room `user:<id>` (notificações) e pode
 * entrar na room `request:<id>` (chat) se for participante da solicitação.
 */
export function initRealtime(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: { origin: env.clientUrl, credentials: true },
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token || typeof token !== 'string') {
      return next(new Error('Token de autenticação não fornecido'));
    }
    try {
      const payload = verifyToken(token);
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, isActive: true },
      });
      if (!user || !user.isActive) {
        return next(new Error('Conta inválida ou desativada'));
      }
      socket.data.userId = user.id;
      return next();
    } catch {
      return next(new Error('Token inválido ou expirado'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId as string;
    socket.join(`user:${userId}`);

    socket.on('request:join', async (requestId: unknown) => {
      if (typeof requestId !== 'string' || !requestId) return;
      const r = await prisma.exchangeRequest.findUnique({
        where: { id: requestId },
        select: { requesterId: true, recipientId: true },
      });
      // Só participantes entram na room do chat
      if (!r || (r.requesterId !== userId && r.recipientId !== userId)) return;
      await socket.join(`request:${requestId}`);
      // Confirmação: o cliente ressincroniza o chat ao recebê-la, cobrindo
      // mensagens enviadas entre o carregamento da página e o join efetivo.
      socket.emit('request:joined', requestId);
    });

    socket.on('request:leave', (requestId: unknown) => {
      if (typeof requestId !== 'string' || !requestId) return;
      socket.leave(`request:${requestId}`);
    });
  });

  setIO(io);
  return io;
}
