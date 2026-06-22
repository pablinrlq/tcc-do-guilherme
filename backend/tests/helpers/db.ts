import { prisma } from '../../src/config/prisma';
import { slugify } from '../../src/utils/slug';

/**
 * Limpa todas as tabelas em ordem segura de chave estrangeira.
 * Chamado em `beforeEach` (ver tests/setup.ts) para isolar cada teste.
 */
export async function resetDb(): Promise<void> {
  await prisma.report.deleteMany();
  await prisma.exchangeRequestEvent.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.coinTransaction.deleteMany();
  await prisma.review.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.exchangeRequest.deleteMany();
  await prisma.match.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.savedSkill.deleteMany();
  await prisma.userTeachingSkill.deleteMany();
  await prisma.userLearningSkill.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.category.deleteMany();
}

/**
 * Cria uma categoria + habilidades mínimas e devolve um mapa por nome.
 * Útil para testes que precisam de um catálogo básico.
 */
export async function seedBaseData() {
  const category = await prisma.category.create({
    data: { name: 'Música', slug: 'musica', icon: '🎵', color: '#8b5cf6' },
  });
  const violino = await prisma.skill.create({
    data: { name: 'Violino', slug: 'violino', categoryId: category.id },
  });
  const trico = await prisma.skill.create({
    data: { name: 'Tricô', slug: slugify('Tricô'), categoryId: category.id },
  });
  return { category, violino, trico };
}
