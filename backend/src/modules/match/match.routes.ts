import { Router } from 'express';
import * as matchController from './match.controller';
import { asyncHandler } from '../../utils/async-handler';
import { authenticate } from '../../middlewares/auth';

export const matchRoutes = Router();

matchRoutes.get('/match/:userId', authenticate, asyncHandler(matchController.getMatch));
