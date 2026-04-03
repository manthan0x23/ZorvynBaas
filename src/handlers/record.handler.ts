import { Request, Response } from "express";
import { asyncHandler } from "../lib/handler";
import { recordService } from "../services/record.service";

export const recordHandler = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const record = await recordService.create(req.validated.body);
    res.status(201).json({ ok: true, data: record });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const id = req.validated.params.id as string;

    const record = await recordService.getById(id);
    res.json({ ok: true, data: record });
  }),

  getAll: asyncHandler(async (req: Request, res: Response) => {
    const records = await recordService.getAll(req.validated.body);
    res.json({ ok: true, data: records });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const id = req.validated.params.id as string;

    const record = await recordService.update(id, req.validated.body);
    res.json({ ok: true, data: record });
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const id = req.validated.params.id as string;

    await recordService.delete(id);
    res.json({ ok: true });
  }),

  getDashboardSummary: asyncHandler(async (req: Request, res: Response) => {
    const summary = await recordService.getDashboardSummary(req.validated.body);
    res.json({ ok: true, data: summary });
  }),

  getMonthlyTrends: asyncHandler(async (req: Request, res: Response) => {
    const trends = await recordService.getMonthlyTrends(
      req.validated.query.year as unknown as number,
    );
    res.json({ ok: true, data: trends });
  }),
};
