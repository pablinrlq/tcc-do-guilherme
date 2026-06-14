import { prisma } from '../../config/prisma';

export async function list(userId: string, page = 1, limit = 20) {
  const [items, total, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notification.count({ where: { userId } }),
    prisma.notification.count({ where: { userId, read: false } }),
  ]);
  return { items, total, unread, page, limit, hasMore: page * limit < total };
}

export async function unreadCount(userId: string) {
  const unread = await prisma.notification.count({ where: { userId, read: false } });
  return { unread };
}

export async function markRead(userId: string, id: string) {
  await prisma.notification.updateMany({ where: { id, userId }, data: { read: true } });
  return { success: true };
}

export async function markAllRead(userId: string) {
  await prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
  return { success: true };
}
