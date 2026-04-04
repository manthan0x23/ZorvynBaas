import { Router } from "express";
import { dashboardHandler } from "~/handlers/dashboard.handler";
import { authenticate } from "~/middlewares/authenticate";
import { authorize } from "~/middlewares/authorize";
import { validate } from "~/middlewares/validate";
import {
  DashboardFilterSchema,
  InsightsSchema,
  TrendsSchema,
} from "~/validators/dashboard.validator";

const router = Router();

router.use(authenticate);

router.get(
  "/summary",
  authorize("dashboard:read"),
  validate(DashboardFilterSchema, "query"),
  dashboardHandler.getSummary,
);

router.get(
  "/trends",
  authorize("dashboard:insights"),
  validate(TrendsSchema, "query"),
  dashboardHandler.getTrends,
);

router.get(
  "/insights",
  authorize("dashboard:insights"),
  validate(InsightsSchema, "query"),
  dashboardHandler.getInsights,
);

export { router as dashboardRoutes };
