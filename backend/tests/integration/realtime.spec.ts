import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import type { Server } from 'socket.io';
import { io as clientIO, type Socket as ClientSocket } from 'socket.io-client';
import { createApp } from '../../src/app';
import { initRealtime } from '../../src/realtime/socket-server';
import { setIO } from '../../src/realtime/realtime';
import { signToken } from '../../src/utils/jwt';
import { prisma } from '../../src/config/prisma';
import { makeUser, makeSkill, addTeaching } from '../helpers/factories';
import * as requestService from '../../src/modules/requests/request.service';

let server: http.Server;
let io: Server;
let baseUrl: string;
const clients: ClientSocket[] = [];

function connect(token?: unknown): ClientSocket {
  const socket = clientIO(baseUrl, {
    auth: token === undefined ? {} : { token: token as any },
    transports: ['websocket'],
    reconnection: false,
  });
  clients.push(socket);
  return socket;
}

function waitConnect(socket: ClientSocket): Promise<void> {
  return new Promise((resolve, reject) => {
    socket.on('connect', () => resolve());
    socket.on('connect_error', (err) => reject(err));
  });
}

function waitConnectError(socket: ClientSocket): Promise<Error> {
  return new Promise((resolve) => {
    socket.on('connect_error', (err) => resolve(err));
  });
}

function waitEvent<T = any>(socket: ClientSocket, event: string): Promise<T> {
  return new Promise((resolve) => socket.once(event, resolve));
}

/** Garante que um evento NÃO chega num intervalo curto. */
function expectSilence(socket: ClientSocket, event: string, ms = 300): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    socket.once(event, () => {
      clearTimeout(timer);
      reject(new Error(`Evento inesperado: ${event}`));
    });
  });
}

/** Cria dois usuários com uma solicitação ACEITA entre eles (chat liberado). */
async function makeAcceptedRequest() {
  const alice = await makeUser({ onboardingCompleted: true });
  const bob = await makeUser({ onboardingCompleted: true, balance: 100 });
  const skill = await makeSkill(`Skill RT ${Date.now()}`);
  await addTeaching(alice.user.id, skill.id, { coinPrice: 10 });
  const request = await prisma.exchangeRequest.create({
    data: {
      requesterId: bob.user.id,
      recipientId: alice.user.id,
      requestedSkillId: skill.id,
      type: 'COIN',
      status: 'ACCEPTED',
      coinAmount: 10,
    },
  });
  return { alice, bob, request };
}

beforeAll(async () => {
  server = http.createServer(createApp());
  io = initRealtime(server);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  baseUrl = `http://localhost:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  setIO(null);
  io.close();
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

afterEach(() => {
  for (const c of clients.splice(0)) c.disconnect();
});

describe('handshake (autenticação do socket)', () => {
  it('aceita conexão com JWT válido', async () => {
    const { user } = await makeUser();
    const socket = connect(signToken({ sub: user.id, role: user.role }));
    await waitConnect(socket);
    expect(socket.connected).toBe(true);
  });

  it('recusa conexão sem token', async () => {
    const socket = connect();
    const err = await waitConnectError(socket);
    expect(err.message).toMatch(/não fornecido/i);
  });

  it('recusa token que não é string', async () => {
    const socket = connect(12345);
    const err = await waitConnectError(socket);
    expect(err.message).toMatch(/não fornecido/i);
  });

  it('recusa token inválido', async () => {
    const socket = connect('token-falso');
    const err = await waitConnectError(socket);
    expect(err.message).toMatch(/inválido ou expirado/i);
  });

  it('recusa conta desativada', async () => {
    const { user } = await makeUser();
    await prisma.user.update({ where: { id: user.id }, data: { isActive: false } });
    const socket = connect(signToken({ sub: user.id, role: user.role }));
    const err = await waitConnectError(socket);
    expect(err.message).toMatch(/inválida ou desativada/i);
  });

  it('recusa usuário que não existe mais', async () => {
    const { user, token } = await makeUser();
    await prisma.user.delete({ where: { id: user.id } });
    const socket = connect(token);
    const err = await waitConnectError(socket);
    expect(err.message).toMatch(/inválida ou desativada/i);
  });
});

describe('notificações em tempo real (room user:<id>)', () => {
  it('aceitar uma solicitação emite notification:new e request:updated ao solicitante', async () => {
    const { alice, bob, request } = await makeAcceptedRequest();
    // Cria uma nova solicitação PENDING de bob → alice para aceitar
    const skill2 = await makeSkill(`Skill RT2 ${Date.now()}`);
    await addTeaching(alice.user.id, skill2.id, { coinPrice: 5 });
    const pending = await prisma.exchangeRequest.create({
      data: {
        requesterId: bob.user.id,
        recipientId: alice.user.id,
        requestedSkillId: skill2.id,
        type: 'COIN',
        status: 'PENDING',
        coinAmount: 5,
      },
    });
    void request;

    const bobSocket = connect(bob.token);
    await waitConnect(bobSocket);

    const notification = waitEvent(bobSocket, 'notification:new');
    const updated = waitEvent(bobSocket, 'request:updated');
    await requestService.acceptRequest(alice.user.id, pending.id);

    expect(await notification).toEqual({ link: `/requests/${pending.id}` });
    expect(await updated).toEqual({ requestId: pending.id, status: 'ACCEPTED' });
  });
});

describe('chat em tempo real (room request:<id>)', () => {
  it('participante na room recebe chat:message; quem saiu não recebe', async () => {
    const { alice, bob, request } = await makeAcceptedRequest();

    const bobSocket = connect(bob.token);
    await waitConnect(bobSocket);
    const joined = waitEvent(bobSocket, 'request:joined');
    bobSocket.emit('request:join', request.id);
    // O servidor confirma o join — sem sleeps arbitrários
    expect(await joined).toBe(request.id);

    const received = waitEvent(bobSocket, 'chat:message');
    await requestService.sendMessage(alice.user.id, request.id, 'Olá, Bob!');
    const msg: any = await received;
    expect(msg.content).toBe('Olá, Bob!');
    expect(msg.sender.id).toBe(alice.user.id);

    // Sai da room → não recebe mais mensagens do chat
    bobSocket.emit('request:leave', request.id);
    await new Promise((r) => setTimeout(r, 150));
    const silence = expectSilence(bobSocket, 'chat:message');
    await requestService.sendMessage(alice.user.id, request.id, 'Ainda aí?');
    await silence;
  });

  it('intruso não entra na room de solicitação alheia', async () => {
    const { alice, request } = await makeAcceptedRequest();
    const intruso = await makeUser({ onboardingCompleted: true });

    const socket = connect(intruso.token);
    await waitConnect(socket);
    // Join recusado silenciosamente: nenhuma confirmação chega
    const noAck = expectSilence(socket, 'request:joined');
    socket.emit('request:join', request.id);
    await noAck;

    const silence = expectSilence(socket, 'chat:message');
    await requestService.sendMessage(alice.user.id, request.id, 'Mensagem privada');
    await silence;
  });

  it('ignora payloads inválidos em request:join e request:leave', async () => {
    const { bob, request } = await makeAcceptedRequest();
    const socket = connect(bob.token);
    await waitConnect(socket);

    // Payloads não-string e ids inexistentes não derrubam o servidor
    socket.emit('request:join', 123);
    socket.emit('request:join', '');
    socket.emit('request:join', 'id-que-nao-existe');
    socket.emit('request:leave', 456);
    socket.emit('request:leave', '');
    socket.emit('request:leave', request.id);
    await new Promise((r) => setTimeout(r, 200));
    expect(socket.connected).toBe(true);
  });
});
