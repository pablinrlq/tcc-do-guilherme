import { z } from 'zod';
import { REQUEST_TYPES } from '../../utils/constants';

export const createRequestSchema = z
  .object({
    recipientId: z.string().min(1),
    requestedSkillId: z.string().min(1),
    type: z.enum(REQUEST_TYPES),
    offeredSkillId: z.string().optional(),
    coinAmount: z.number().int().min(1).max(100000).optional(),
    message: z.string().max(500).optional(),
    suggestedDate: z.coerce.date().optional(),
  })
  .refine((d) => d.type !== 'EXCHANGE' || Boolean(d.offeredSkillId), {
    message: 'Informe a habilidade oferecida na troca',
    path: ['offeredSkillId'],
  });
export type CreateRequestInput = z.infer<typeof createRequestSchema>;

export const sendMessageSchema = z.object({
  content: z.string().min(1, 'Mensagem vazia').max(1000),
});
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
