import { Request, Response, NextFunction } from 'express';

/**
 * Envolve handlers assíncronos para que erros sejam encaminhados
 * automaticamente ao middleware global de erros, evitando try/catch repetido.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
