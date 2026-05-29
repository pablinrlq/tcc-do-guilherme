import { Router } from 'express';
import * as skillController from './skill.controller';
import { asyncHandler } from '../../utils/async-handler';
import { authenticate } from '../../middlewares/auth';

export const skillRoutes = Router();

// Catálogo público
skillRoutes.get('/categories', asyncHandler(skillController.listCategories));
skillRoutes.get('/skills', asyncHandler(skillController.listSkills));

// Habilidades do usuário autenticado
skillRoutes.get('/skills/me', authenticate, asyncHandler(skillController.getMySkills));
skillRoutes.get('/skills/me/saved', authenticate, asyncHandler(skillController.listSaved));
skillRoutes.get('/skills/suggestions', authenticate, asyncHandler(skillController.suggestions));

// Salvar/remover habilidades de interesse (bookmark)
skillRoutes.post('/skills/:id/save', authenticate, asyncHandler(skillController.save));
skillRoutes.delete('/skills/:id/save', authenticate, asyncHandler(skillController.unsave));

skillRoutes.post('/skills/teaching', authenticate, asyncHandler(skillController.addTeaching));
skillRoutes.patch('/skills/teaching/:id', authenticate, asyncHandler(skillController.updateTeaching));
skillRoutes.delete('/skills/teaching/:id', authenticate, asyncHandler(skillController.removeTeaching));

skillRoutes.post('/skills/learning', authenticate, asyncHandler(skillController.addLearning));
skillRoutes.patch('/skills/learning/:id', authenticate, asyncHandler(skillController.updateLearning));
skillRoutes.delete('/skills/learning/:id', authenticate, asyncHandler(skillController.removeLearning));
