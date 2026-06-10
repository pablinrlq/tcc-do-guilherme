import { Response } from 'express';
import * as walletService from './wallet.service';
import { AuthRequest } from '../../middlewares/auth';
import { purchaseCoinsSchema } from './wallet.schemas';

export async function getWallet(req: AuthRequest, res: Response): Promise<Response> {
  return res.json({ wallet: await walletService.getWallet(req.userId!) });
}

export async function getHistory(req: AuthRequest, res: Response): Promise<Response> {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  return res.json(await walletService.getHistory(req.userId!, page, limit));
}

export async function purchase(req: AuthRequest, res: Response): Promise<Response> {
  const { amount } = purchaseCoinsSchema.parse(req.body);
  return res.json({ wallet: await walletService.purchaseCoins(req.userId!, amount) });
}
