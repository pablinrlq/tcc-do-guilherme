import { Router } from 'express';
import * as reportController from './report.controller';
import { asyncHandler } from '../../utils/async-handler';
import { authenticate, requireAdmin } from '../../middlewares/auth';

export const reportRoutes = Router();

reportRoutes.post('/', authenticate, asyncHandler(reportController.create));
reportRoutes.get('/mine', authenticate, asyncHandler(reportController.listMine));
reportRoutes.get('/admin', authenticate, requireAdmin, asyncHandler(reportController.listAdmin));
reportRoutes.patch('/admin/:id', authenticate, requireAdmin, asyncHandler(reportController.resolve));
