import crypto from 'node:crypto';

/**
 * Gera um token de recuperação de senha. O valor bruto (`raw`) é entregue
 * ao usuário; apenas o hash SHA-256 é persistido — se o banco vazar, os
 * tokens não podem ser usados.
 */
export function generateResetToken(): { raw: string; hash: string } {
  const raw = crypto.randomBytes(32).toString('hex');
  return { raw, hash: hashResetToken(raw) };
}

/** Hash determinístico (SHA-256) usado para buscar o token no banco. */
export function hashResetToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}
