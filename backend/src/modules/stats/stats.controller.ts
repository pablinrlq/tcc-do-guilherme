import { Request, Response } from 'express';
import * as statsService from './stats.service';

export async function trends(req: Request, res: Response): Promise<Response> {
  const limit = Math.min(20, Math.max(1, Number(req.query.limit) || 8));
  return res.json(await statsService.getTrends(limit));
}

export async function ranking(req: Request, res: Response): Promise<Response> {
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  return res.json(await statsService.getRanking(limit));
}

export async function overview(_req: Request, res: Response): Promise<Response> {
  return res.json(await statsService.getOverview());
}
