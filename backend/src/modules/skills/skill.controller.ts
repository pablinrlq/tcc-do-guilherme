import { Request, Response } from 'express';
import * as skillService from './skill.service';
import { AuthRequest } from '../../middlewares/auth';
import {
  createTeachingSkillSchema,
  updateTeachingSkillSchema,
  createLearningSkillSchema,
  updateLearningSkillSchema,
} from './skill.schemas';

export async function listCategories(_req: Request, res: Response): Promise<Response> {
  return res.json({ categories: await skillService.listCategories() });
}

export async function listSkills(req: Request, res: Response): Promise<Response> {
  const q = typeof req.query.q === 'string' ? req.query.q : undefined;
  const categoryId = typeof req.query.categoryId === 'string' ? req.query.categoryId : undefined;
  return res.json({ skills: await skillService.listSkills(q, categoryId) });
}

export async function getMySkills(req: AuthRequest, res: Response): Promise<Response> {
  return res.json(await skillService.getMySkills(req.userId!));
}

export async function listSaved(req: AuthRequest, res: Response): Promise<Response> {
  return res.json(await skillService.listSavedSkills(req.userId!));
}

export async function suggestions(req: AuthRequest, res: Response): Promise<Response> {
  const limit = Math.min(20, Math.max(1, Number(req.query.limit) || 8));
  return res.json(await skillService.getSuggestedSkills(req.userId!, limit));
}

export async function save(req: AuthRequest, res: Response): Promise<Response> {
  return res.status(201).json(await skillService.saveSkill(req.userId!, req.params.id));
}

export async function unsave(req: AuthRequest, res: Response): Promise<Response> {
  return res.json(await skillService.unsaveSkill(req.userId!, req.params.id));
}

export async function addTeaching(req: AuthRequest, res: Response): Promise<Response> {
  const data = createTeachingSkillSchema.parse(req.body);
  return res.status(201).json(await skillService.addTeachingSkill(req.userId!, data));
}

export async function updateTeaching(req: AuthRequest, res: Response): Promise<Response> {
  const data = updateTeachingSkillSchema.parse(req.body);
  return res.json(await skillService.updateTeachingSkill(req.userId!, req.params.id, data));
}

export async function removeTeaching(req: AuthRequest, res: Response): Promise<Response> {
  return res.json(await skillService.removeTeachingSkill(req.userId!, req.params.id));
}

export async function addLearning(req: AuthRequest, res: Response): Promise<Response> {
  const data = createLearningSkillSchema.parse(req.body);
  return res.status(201).json(await skillService.addLearningSkill(req.userId!, data));
}

export async function updateLearning(req: AuthRequest, res: Response): Promise<Response> {
  const data = updateLearningSkillSchema.parse(req.body);
  return res.json(await skillService.updateLearningSkill(req.userId!, req.params.id, data));
}

export async function removeLearning(req: AuthRequest, res: Response): Promise<Response> {
  return res.json(await skillService.removeLearningSkill(req.userId!, req.params.id));
}
