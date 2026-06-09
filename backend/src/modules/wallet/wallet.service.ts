import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError } from '../../utils/errors';

/**
 * O parâmetro `db` aceita o client global ou um client de transação,
 * permitindo reutilizar as operações dentro de transações atômicas
 * (ex.: criar solicitação + reservar moedas).
 */
type Db = Prisma.TransactionClient;

async function getOrCreateWallet(db: Db, userId: string) {
  const existing = await db.wallet.findUnique({ where: { userId } });
  if (existing) return existing;
  return db.wallet.create({ data: { userId } });
}

async function recordTransaction(
  db: Db,
  walletId: string,
  amount: number,
  type: string,
  balanceAfter: number,
  description?: string,
  relatedRequestId?: string,
) {
  return db.coinTransaction.create({
    data: { walletId, amount, type, balanceAfter, description, relatedRequestId },
  });
}

/** Reserva (bloqueia) moedas do solicitante até a confirmação da aula. */
export async function lockCoins(db: Db, userId: string, amount: number, requestId?: string) {
  const wallet = await getOrCreateWallet(db, userId);
  if (wallet.balance < amount) {
    throw new BadRequestError('Saldo de moedas insuficiente para reservar a aula');
  }
  const updated = await db.wallet.update({
    where: { id: wallet.id },
    data: { balance: { decrement: amount }, lockedBalance: { increment: amount } },
  });
  await recordTransaction(
    db,
    wallet.id,
    -amount,
    'LOCK',
    updated.balance,
    'Reserva de moedas para aula',
    requestId,
  );
}

/** Estorna moedas reservadas (cancelamento/recusa). */
export async function unlockCoins(db: Db, userId: string, amount: number, requestId?: string) {
  const wallet = await getOrCreateWallet(db, userId);
  const updated = await db.wallet.update({
    where: { id: wallet.id },
    data: { balance: { increment: amount }, lockedBalance: { decrement: amount } },
  });
  await recordTransaction(
    db,
    wallet.id,
    amount,
    'UNLOCK',
    updated.balance,
    'Estorno de moedas reservadas',
    requestId,
  );
}

/**
 * Liquida o pagamento após a aula confirmada: as moedas reservadas saem do
 * solicitante (pagador) e são creditadas ao professor (recebedor).
 */
export async function settlePayment(
  db: Db,
  payerId: string,
  payeeId: string,
  amount: number,
  requestId?: string,
) {
  const payerWallet = await getOrCreateWallet(db, payerId);
  const payerUpdated = await db.wallet.update({
    where: { id: payerWallet.id },
    data: { lockedBalance: { decrement: amount } },
  });
  // A baixa do saldo disponível ocorreu no LOCK; aqui registramos a confirmação.
  await recordTransaction(
    db,
    payerWallet.id,
    0,
    'SPEND',
    payerUpdated.balance,
    `Aula concluída — ${amount} moedas pagas ao professor`,
    requestId,
  );

  const payeeWallet = await getOrCreateWallet(db, payeeId);
  const payeeUpdated = await db.wallet.update({
    where: { id: payeeWallet.id },
    data: { balance: { increment: amount } },
  });
  await recordTransaction(
    db,
    payeeWallet.id,
    amount,
    'EARNING',
    payeeUpdated.balance,
    'Recebimento por aula concluída',
    requestId,
  );
}

/** Compra/recarga de moedas (simulada no MVP — preparada para pagamento real). */
export async function purchaseCoins(userId: string, amount: number) {
  const wallet = await getOrCreateWallet(prisma, userId);
  const updated = await prisma.wallet.update({
    where: { id: wallet.id },
    data: { balance: { increment: amount } },
  });
  await recordTransaction(
    prisma,
    wallet.id,
    amount,
    'PURCHASE',
    updated.balance,
    'Compra de moedas',
  );
  return { balance: updated.balance, lockedBalance: updated.lockedBalance };
}

export async function getWallet(userId: string) {
  const wallet = await getOrCreateWallet(prisma, userId);
  return { balance: wallet.balance, lockedBalance: wallet.lockedBalance };
}

export async function getHistory(userId: string, page = 1, limit = 20) {
  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) throw new NotFoundError('Carteira não encontrada');

  const [transactions, total] = await Promise.all([
    prisma.coinTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.coinTransaction.count({ where: { walletId: wallet.id } }),
  ]);

  return {
    wallet: { balance: wallet.balance, lockedBalance: wallet.lockedBalance },
    transactions: transactions.map((t) => ({
      id: t.id,
      amount: t.amount,
      type: t.type,
      description: t.description,
      balanceAfter: t.balanceAfter,
      relatedRequestId: t.relatedRequestId,
      createdAt: t.createdAt,
    })),
    page,
    limit,
    total,
    hasMore: page * limit < total,
  };
}
