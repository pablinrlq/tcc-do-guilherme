import http from 'node:http';
import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';
import { initRealtime } from './realtime/socket-server';
import { setIO } from './realtime/realtime';

const app = createApp();
const server = http.createServer(app);
const io = initRealtime(server);

server.listen(env.port, '0.0.0.0', () => {
  console.log(`\n🚀 SkillEx API rodando em http://0.0.0.0:${env.port}`);
  console.log(`   Healthcheck: http://0.0.0.0:${env.port}/health`);
  console.log(`   WebSocket: ws://0.0.0.0:${env.port}/socket.io`);
  console.log(`   Ambiente: ${env.nodeEnv}\n`);
});

// Encerramento gracioso (libera socket.io e a conexão com o banco)
async function shutdown() {
  console.log('\n⏳ Encerrando servidor SkillEx...');
  setIO(null);
  io.close();
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
