import { Request, Response } from "express";
import { asyncHandler } from "../lib/handler";
import { dashboardService } from "~/services/dashboard.service";
import { logger } from "~/lib/logger";
import { createContext } from "~/lib/ctx";

export const dashboardHandler = {
  getSummary: asyncHandler(async (req: Request, res: Response) => {
    logger.info(createContext(req), `[${req.id}] dashboard.summary (handler)`);

    const summary = await dashboardService.getDashboardSummary(
      createContext(req),
      req.validated.query,
    );

    res.json({ ok: true, data: summary });
  }),

  getTrends: asyncHandler(async (req: Request, res: Response) => {
    logger.info(createContext(req), `[${req.id}] dashboard.trends (handler)`);
    const { year, period } = req.validated.query;

    const data =
      period === "weekly"
        ? await dashboardService.getWeeklyTrends(createContext(req), year)
        : await dashboardService.getMonthlyTrends(createContext(req), year);

    res.json({ ok: true, data });
  }),

  getInsights: asyncHandler(async (req: Request, res: Response) => {
    logger.info(createContext(req), `[${req.id}] dashboard.insights (handler)`);

    const insights = await dashboardService.getInsights(
      createContext(req),
      req.validated.query,
    );

    res.json({ ok: true, data: insights });
  }),
};
