import { Response } from 'express';
import * as requestService from './request.service';
import { AuthRequest } from '../../middlewares/auth';
import { createRequestSchema, sendMessageSchema } from './request.schemas';

export async function create(req: AuthRequest, res: Response): Promise<Response> {
  const data = createRequestSchema.parse(req.body);
  return res.status(201).json({ request: await requestService.createRequest(req.userId!, data) });
}

export async function list(req: AuthRequest, res: Response): Promise<Response> {
  const box = (['sent', 'received', 'all'] as const).includes(req.query.box as any)
    ? (req.query.box as 'sent' | 'received' | 'all')
    : 'all';
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  return res.json(await requestService.listRequests(req.userId!, box, status));
}

export async function detail(req: AuthRequest, res: Response): Promise<Response> {
  return res.json({ request: await requestService.getRequestById(req.userId!, req.params.id) });
}

export async function accept(req: AuthRequest, res: Response): Promise<Response> {
  return res.json({ request: await requestService.acceptRequest(req.userId!, req.params.id) });
}

export async function reject(req: AuthRequest, res: Response): Promise<Response> {
  return res.json({ request: await requestService.rejectRequest(req.userId!, req.params.id) });
}

export async function cancel(req: AuthRequest, res: Response): Promise<Response> {
  return res.json({ request: await requestService.cancelRequest(req.userId!, req.params.id) });
}

export async function complete(req: AuthRequest, res: Response): Promise<Response> {
  return res.json({ request: await requestService.completeRequest(req.userId!, req.params.id) });
}

export async function listMessages(req: AuthRequest, res: Response): Promise<Response> {
  return res.json(await requestService.listMessages(req.userId!, req.params.id));
}

export async function sendMessage(req: AuthRequest, res: Response): Promise<Response> {
  const { content } = sendMessageSchema.parse(req.body);
  return res
    .status(201)
    .json({ message: await requestService.sendMessage(req.userId!, req.params.id, content) });
}
