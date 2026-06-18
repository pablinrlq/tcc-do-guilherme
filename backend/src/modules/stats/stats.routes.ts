import { Router } from 'express';
import * as statsController from './stats.controller';
import { asyncHandler } from '../../utils/async-handler';
import { authenticate, requireAdmin } from '../../middlewares/auth';

export const statsRoutes = Router();

// Tendências de habilidades (qualquer usuário autenticado)
statsRoutes.get('/trends', authenticate, asyncHandler(statsController.trends));

// Ranking de reputação (qualquer usuário autenticado)
statsRoutes.get('/ranking', authenticate, asyncHandler(statsController.ranking));

// Visão geral da plataforma (somente administradores)
statsRoutes.get('/overview', authenticate, requireAdmin, asyncHandler(statsController.overview));
