import { Request, Response } from "express";
import { asyncHandler } from "../lib/handler";
import { dashboardService } from "~/services/dashboard.service";

export const dashboardHandler = {
  getSummary: asyncHandler(async (req: Request, res: Response) => {
    const summary = await dashboardService.getDashboardSummary(
      req.validated.query,
    );
    res.json({ ok: true, data: summary });
  }),

  getTrends: asyncHandler(async (req: Request, res: Response) => {
    const { year, period } = req.validated.query;

    const data =
      period === "weekly"
        ? await dashboardService.getWeeklyTrends(year)
        : await dashboardService.getMonthlyTrends(year);

    res.json({ ok: true, data });
  }),

  getInsights: asyncHandler(async (req: Request, res: Response) => {
    const insights = await dashboardService.getInsights(req.validated.query);
    res.json({ ok: true, data: insights });
  }),
};
