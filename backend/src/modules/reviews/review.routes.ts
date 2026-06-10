import { Router } from 'express';
import * as reviewController from './review.controller';
import { asyncHandler } from '../../utils/async-handler';
import { authenticate } from '../../middlewares/auth';

export const reviewRoutes = Router();

reviewRoutes.post('/', authenticate, asyncHandler(reviewController.create));
reviewRoutes.get('/user/:userId', authenticate, asyncHandler(reviewController.listForUser));
