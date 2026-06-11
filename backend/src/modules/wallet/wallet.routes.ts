import { Router } from 'express';
import * as walletController from './wallet.controller';
import { asyncHandler } from '../../utils/async-handler';
import { authenticate } from '../../middlewares/auth';

export const walletRoutes = Router();

walletRoutes.get('/wallet', authenticate, asyncHandler(walletController.getWallet));
walletRoutes.get('/wallet/history', authenticate, asyncHandler(walletController.getHistory));
walletRoutes.post('/wallet/purchase', authenticate, asyncHandler(walletController.purchase));
