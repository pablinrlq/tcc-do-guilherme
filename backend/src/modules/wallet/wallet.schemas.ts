import { z } from 'zod';

export const purchaseCoinsSchema = z.object({
  amount: z.number().int().min(1).max(100000),
});
export type PurchaseCoinsInput = z.infer<typeof purchaseCoinsSchema>;
