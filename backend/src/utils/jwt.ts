import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export interface TokenPayload {
  sub: string; // id do usuário
  role: string;
}

/**
 * Gera um token JWT assinado para o usuário autenticado.
 */
export function signToken(payload: TokenPayload): string {
  const options: SignOptions = {
    expiresIn: env.jwtExpiresIn as unknown as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.jwtSecret, options);
}

/**
 * Valida e decodifica um token JWT. Lança erro se inválido/expirado.
 */
export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, env.jwtSecret) as TokenPayload;
}
