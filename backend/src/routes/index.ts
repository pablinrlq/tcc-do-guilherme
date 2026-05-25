import { Router } from 'express';
import { authRoutes } from '../modules/auth/auth.routes';
import { userRoutes } from '../modules/users/user.routes';
import { skillRoutes } from '../modules/skills/skill.routes';
import { feedRoutes } from '../modules/feed/feed.routes';
import { matchRoutes } from '../modules/match/match.routes';
import { requestRoutes } from '../modules/requests/request.routes';
import { walletRoutes } from '../modules/wallet/wallet.routes';
import { reviewRoutes } from '../modules/reviews/review.routes';
import { notificationRoutes } from '../modules/notifications/notification.routes';
import { statsRoutes } from '../modules/stats/stats.routes';
import { adminRoutes } from '../modules/admin/admin.routes';
import { reportRoutes } from '../modules/reports/report.routes';

export const routes = Router();

routes.use('/auth', authRoutes);
routes.use('/users', userRoutes);
routes.use('/', skillRoutes); // /categories, /skills/*
routes.use('/', feedRoutes); // /feed, /feed/suggestions
routes.use('/', matchRoutes); // /match/:userId
routes.use('/requests', requestRoutes);
routes.use('/', walletRoutes); // /wallet/*
routes.use('/reviews', reviewRoutes);
routes.use('/notifications', notificationRoutes);
routes.use('/stats', statsRoutes);
routes.use('/admin', adminRoutes);
routes.use('/reports', reportRoutes);
