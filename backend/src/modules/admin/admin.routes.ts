import { Router } from 'express';
import * as adminController from './admin.controller';
import { asyncHandler } from '../../utils/async-handler';
import { authenticate, requireAdmin } from '../../middlewares/auth';

export const adminRoutes = Router();

// Todas as rotas administrativas exigem token válido + papel ADMIN.
adminRoutes.use(authenticate, requireAdmin);

adminRoutes.get('/users', asyncHandler(adminController.listUsers));
adminRoutes.patch('/users/:id/status', asyncHandler(adminController.setUserStatus));

adminRoutes.post('/categories', asyncHandler(adminController.createCategory));
adminRoutes.patch('/categories/:id', asyncHandler(adminController.updateCategory));
adminRoutes.delete('/categories/:id', asyncHandler(adminController.deleteCategory));

adminRoutes.post('/skills', asyncHandler(adminController.createSkill));
adminRoutes.patch('/skills/:id', asyncHandler(adminController.updateSkill));
adminRoutes.delete('/skills/:id', asyncHandler(adminController.deleteSkill));
