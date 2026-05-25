import { Request, Response } from 'express';
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth.schemas';
import * as authService from './auth.service';
import { AuthRequest } from '../../middlewares/auth';

export async function register(req: Request, res: Response): Promise<Response> {
  const data = registerSchema.parse(req.body);
  const result = await authService.register(data);
  return res.status(201).json(result);
}

export async function login(req: Request, res: Response): Promise<Response> {
  const data = loginSchema.parse(req.body);
  const result = await authService.login(data);
  return res.json(result);
}

export async function me(req: AuthRequest, res: Response): Promise<Response> {
  const user = await authService.getMe(req.userId!);
  return res.json({ user });
}

export async function changePassword(req: AuthRequest, res: Response): Promise<Response> {
  const data = changePasswordSchema.parse(req.body);
  const result = await authService.changePassword(req.userId!, data);
  return res.json(result);
}

export async function forgotPassword(req: Request, res: Response): Promise<Response> {
  const data = forgotPasswordSchema.parse(req.body);
  const result = await authService.forgotPassword(data);
  return res.json(result);
}

export async function resetPassword(req: Request, res: Response): Promise<Response> {
  const data = resetPasswordSchema.parse(req.body);
  const result = await authService.resetPassword(data);
  return res.json(result);
}
