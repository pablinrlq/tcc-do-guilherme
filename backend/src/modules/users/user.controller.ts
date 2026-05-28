import { Response } from 'express';
import * as userService from './user.service';
import { AuthRequest } from '../../middlewares/auth';
import { BadRequestError } from '../../utils/errors';
import {
  updateBasicSchema,
  updateProfileSchema,
  onboardingSchema,
  searchSchema,
  deleteAccountSchema,
} from './user.schemas';

export async function updateBasic(req: AuthRequest, res: Response): Promise<Response> {
  const data = updateBasicSchema.parse(req.body);
  return res.json({ user: await userService.updateBasicInfo(req.userId!, data) });
}

export async function updateProfile(req: AuthRequest, res: Response): Promise<Response> {
  const data = updateProfileSchema.parse(req.body);
  return res.json({ user: await userService.updateProfile(req.userId!, data) });
}

export async function completeOnboarding(req: AuthRequest, res: Response): Promise<Response> {
  const data = onboardingSchema.parse(req.body);
  return res.json({ user: await userService.completeOnboarding(req.userId!, data) });
}

export async function uploadAvatar(req: AuthRequest, res: Response): Promise<Response> {
  if (!req.file) throw new BadRequestError('Nenhuma imagem enviada');
  return res.json({ user: await userService.setAvatar(req.userId!, req.file.filename) });
}

export async function deleteAccount(req: AuthRequest, res: Response): Promise<Response> {
  const { password } = deleteAccountSchema.parse(req.body);
  return res.json(await userService.deleteAccount(req.userId!, password));
}

export async function getPublicProfile(req: AuthRequest, res: Response): Promise<Response> {
  return res.json({ user: await userService.getPublicProfile(req.userId!, req.params.id) });
}

export async function searchUsers(req: AuthRequest, res: Response): Promise<Response> {
  const filters = searchSchema.parse(req.query);
  return res.json(await userService.searchUsers(req.userId!, filters));
}

export async function addFavorite(req: AuthRequest, res: Response): Promise<Response> {
  return res.json(await userService.addFavorite(req.userId!, req.params.id));
}

export async function removeFavorite(req: AuthRequest, res: Response): Promise<Response> {
  return res.json(await userService.removeFavorite(req.userId!, req.params.id));
}

export async function listFavorites(req: AuthRequest, res: Response): Promise<Response> {
  return res.json(await userService.listFavorites(req.userId!));
}
