import { Response } from 'express';
import * as feedService from './feed.service';
import { AuthRequest } from '../../middlewares/auth';

export async function getFeed(req: AuthRequest, res: Response): Promise<Response> {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
  const onlyMatches = req.query.onlyMatches === 'true';
  const result = await feedService.computeFeed(req.userId!, { page, limit, onlyMatches });
  return res.json(result);
}

export async function getSuggestions(req: AuthRequest, res: Response): Promise<Response> {
  const limit = Math.min(20, Math.max(1, Number(req.query.limit) || 5));
  const items = await feedService.getSuggestions(req.userId!, limit);
  return res.json({ items });
}
