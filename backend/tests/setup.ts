import { beforeEach, afterAll } from 'vitest';
import { prisma } from '../src/config/prisma';
import { resetDb } from './helpers/db';

// Estado limpo antes de cada teste (tabelas vazias).
beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await prisma.$disconnect();
});
