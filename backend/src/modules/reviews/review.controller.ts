import { Request, Response } from 'express';
import * as reviewService from './review.service';
import { AuthRequest } from '../../middlewares/auth';
import { createReviewSchema } from './review.schemas';

export async function create(req: AuthRequest, res: Response): Promise<Response> {
  const data = createReviewSchema.parse(req.body);
  return res.status(201).json({ review: await reviewService.createReview(req.userId!, data) });
}

export async function listForUser(req: Request, res: Response): Promise<Response> {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
  return res.json(await reviewService.listUserReviews(req.params.userId, page, limit));
}
