import supertest from 'supertest';
import { createApp } from '../../src/app';

/** Instância única do app Express para os testes de integração. */
export const app = createApp();
export const api = supertest(app);

/** Monta o header Authorization com o token informado. */
export function bearer(token: string): string {
  return `Bearer ${token}`;
}
