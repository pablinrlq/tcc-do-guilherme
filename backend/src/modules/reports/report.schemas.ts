import { z } from 'zod';

export const REPORT_TYPES = [
  'INAPPROPRIATE_CONTENT',
  'HARASSMENT',
  'SCAM',
  'FAKE_PROFILE',
  'SPAM',
  'OTHER',
] as const;

export const REPORT_STATUSES = ['PENDING', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED'] as const;

export const createReportSchema = z
  .object({
    targetId: z.string().min(1).optional(),
    requestId: z.string().min(1).optional(),
    type: z.enum(REPORT_TYPES),
    description: z.string().min(10, 'Descreva o problema em pelo menos 10 caracteres').max(1000),
  })
  .refine((d) => d.targetId || d.requestId, {
    message: 'Informe o usuário ou a solicitação denunciada',
  });

export type CreateReportInput = z.infer<typeof createReportSchema>;

export const resolveReportSchema = z.object({
  status: z.enum(['UNDER_REVIEW', 'RESOLVED', 'DISMISSED']),
  adminNote: z.string().max(500).optional(),
});

export type ResolveReportInput = z.infer<typeof resolveReportSchema>;
