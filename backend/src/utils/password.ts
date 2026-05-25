import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Gera o hash seguro de uma senha usando bcrypt.
 */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

/**
 * Compara uma senha em texto puro com seu hash armazenado.
 */
export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
