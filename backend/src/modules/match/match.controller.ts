import { Response } from 'express';
import * as matchService from './match.service';
import { AuthRequest } from '../../middlewares/auth';

export async function getMatch(req: AuthRequest, res: Response): Promise<Response> {
  const result = await matchService.getMatchBetween(req.userId!, req.params.userId);
  return res.json({ match: result });
}
