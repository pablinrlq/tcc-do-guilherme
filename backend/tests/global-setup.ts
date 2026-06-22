import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

/**
 * Executado UMA vez antes de toda a suíte: cria o schema no banco de teste
 * (drop + recreate) usando `prisma db push`. Não toca no dev.db.
 */
export default function setup() {
  const testDbPath = path.resolve(process.cwd(), 'prisma/test.db');
  const dbUrl = 'file:' + testDbPath;

  // Remove resíduos de execuções anteriores (inclui arquivos -journal/-wal).
  for (const suffix of ['', '-journal', '-wal', '-shm']) {
    const f = testDbPath + suffix;
    if (fs.existsSync(f)) fs.rmSync(f);
  }

  execSync('npx prisma db push --force-reset --skip-generate', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: dbUrl },
  });
}
