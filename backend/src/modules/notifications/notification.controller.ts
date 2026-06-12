import { Response } from 'express';
import * as notificationService from './notification.service';
import { AuthRequest } from '../../middlewares/auth';

export async function list(req: AuthRequest, res: Response): Promise<Response> {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  return res.json(await notificationService.list(req.userId!, page, limit));
}

export async function unreadCount(req: AuthRequest, res: Response): Promise<Response> {
  return res.json(await notificationService.unreadCount(req.userId!));
}

export async function markRead(req: AuthRequest, res: Response): Promise<Response> {
  return res.json(await notificationService.markRead(req.userId!, req.params.id));
}

export async function markAllRead(req: AuthRequest, res: Response): Promise<Response> {
  return res.json(await notificationService.markAllRead(req.userId!));
}
