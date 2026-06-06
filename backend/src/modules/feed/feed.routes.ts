import { Router } from 'express';
import * as feedController from './feed.controller';
import { asyncHandler } from '../../utils/async-handler';
import { authenticate } from '../../middlewares/auth';

export const feedRoutes = Router();

feedRoutes.get('/feed', authenticate, asyncHandler(feedController.getFeed));
feedRoutes.get('/feed/suggestions', authenticate, asyncHandler(feedController.getSuggestions));
