import { Router } from 'express';
import * as userController from './user.controller';
import { asyncHandler } from '../../utils/async-handler';
import { authenticate } from '../../middlewares/auth';
import { upload } from '../../middlewares/upload';

export const userRoutes = Router();

// Busca avançada de usuários
userRoutes.get('/', authenticate, asyncHandler(userController.searchUsers));

// Ações sobre o próprio usuário (rotas "me" antes de "/:id")
userRoutes.patch('/me', authenticate, asyncHandler(userController.updateBasic));
userRoutes.patch('/me/profile', authenticate, asyncHandler(userController.updateProfile));
userRoutes.post('/me/onboarding', authenticate, asyncHandler(userController.completeOnboarding));
userRoutes.post(
  '/me/avatar',
  authenticate,
  upload.single('avatar'),
  asyncHandler(userController.uploadAvatar),
);
userRoutes.get('/me/favorites', authenticate, asyncHandler(userController.listFavorites));
userRoutes.delete('/me', authenticate, asyncHandler(userController.deleteAccount));

// Perfil público e favoritos
userRoutes.get('/:id', authenticate, asyncHandler(userController.getPublicProfile));
userRoutes.post('/:id/favorite', authenticate, asyncHandler(userController.addFavorite));
userRoutes.delete('/:id/favorite', authenticate, asyncHandler(userController.removeFavorite));
