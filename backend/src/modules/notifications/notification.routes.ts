import { Router } from 'express';
import * as notificationController from './notification.controller';
import { asyncHandler } from '../../utils/async-handler';
import { authenticate } from '../../middlewares/auth';

export const notificationRoutes = Router();

notificationRoutes.use(authenticate);

notificationRoutes.get('/', asyncHandler(notificationController.list));
notificationRoutes.get('/unread-count', asyncHandler(notificationController.unreadCount));
notificationRoutes.post('/read-all', asyncHandler(notificationController.markAllRead));
notificationRoutes.post('/:id/read', asyncHandler(notificationController.markRead));
