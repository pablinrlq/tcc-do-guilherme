import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';
import * as adminService from './admin.service';
import {
  listUsersSchema,
  setUserStatusSchema,
  categoryCreateSchema,
  categoryUpdateSchema,
  skillCreateSchema,
  skillUpdateSchema,
} from './admin.schemas';

export async function listUsers(req: AuthRequest, res: Response): Promise<Response> {
  const filters = listUsersSchema.parse(req.query);
  return res.json(await adminService.listUsers(filters));
}

export async function setUserStatus(req: AuthRequest, res: Response): Promise<Response> {
  const { isActive } = setUserStatusSchema.parse(req.body);
  return res.json(await adminService.setUserStatus(req.userId!, req.params.id, isActive));
}

export async function createCategory(req: AuthRequest, res: Response): Promise<Response> {
  const data = categoryCreateSchema.parse(req.body);
  return res.status(201).json(await adminService.createCategory(data));
}

export async function updateCategory(req: AuthRequest, res: Response): Promise<Response> {
  const data = categoryUpdateSchema.parse(req.body);
  return res.json(await adminService.updateCategory(req.params.id, data));
}

export async function deleteCategory(req: AuthRequest, res: Response): Promise<Response> {
  return res.json(await adminService.deleteCategory(req.params.id));
}

export async function createSkill(req: AuthRequest, res: Response): Promise<Response> {
  const data = skillCreateSchema.parse(req.body);
  return res.status(201).json(await adminService.createSkill(data));
}

export async function updateSkill(req: AuthRequest, res: Response): Promise<Response> {
  const data = skillUpdateSchema.parse(req.body);
  return res.json(await adminService.updateSkill(req.params.id, data));
}

export async function deleteSkill(req: AuthRequest, res: Response): Promise<Response> {
  return res.json(await adminService.deleteSkill(req.params.id));
}
