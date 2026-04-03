import { Request, Response } from "express";
import { asyncHandler } from "../lib/handler";
import { recordService } from "../services/record.service";

export const dashboardHandler = {
  getSummary: asyncHandler(async (req: Request, res: Response) => {
    const summary = await recordService.getDashboardSummary(req.query);
    res.json({ ok: true, data: summary });
  }),

  getMonthlyTrends: asyncHandler(async (req: Request, res: Response) => {
    const trends = await recordService.getMonthlyTrends(
      req.query.year as unknown as number,
    );
    res.json({ ok: true, data: trends });
  }),
};
