import { Router } from 'express';
import * as authController from './auth.controller';
import { asyncHandler } from '../../utils/async-handler';
import { authenticate } from '../../middlewares/auth';
import { authLimiter } from '../../middlewares/rate-limit';

export const authRoutes = Router();

authRoutes.post('/register', authLimiter, asyncHandler(authController.register));
authRoutes.post('/login', authLimiter, asyncHandler(authController.login));
authRoutes.get('/me', authenticate, asyncHandler(authController.me));
authRoutes.post('/change-password', authenticate, asyncHandler(authController.changePassword));
authRoutes.post('/forgot-password', authLimiter, asyncHandler(authController.forgotPassword));
authRoutes.post('/reset-password', asyncHandler(authController.resetPassword));
