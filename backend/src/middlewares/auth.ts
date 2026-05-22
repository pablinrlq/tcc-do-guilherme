import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';

/**
 * Estende o Request do Express com os dados do usuário autenticado.
 */
export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

/**
 * Middleware que exige um token JWT válido no header Authorization.
 */
export function authenticate(req: AuthRequest, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw new UnauthorizedError('Token de autenticação não fornecido');
  }

  const token = header.substring(7);
  try {
    const payload = verifyToken(token);
    req.userId = payload.sub;
    req.userRole = payload.role;
    next();
  } catch {
    throw new UnauthorizedError('Token inválido ou expirado');
  }
}

/**
 * Middleware que restringe o acesso a administradores.
 */
export function requireAdmin(req: AuthRequest, _res: Response, next: NextFunction): void {
  if (req.userRole !== 'ADMIN') {
    throw new ForbiddenError('Acesso restrito a administradores');
  }
  next();
}
