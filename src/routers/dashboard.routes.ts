import { Router } from "express";
import { dashboardHandler } from "../handlers/dashboard.handler";
import { authenticate } from "~/middlewares/authenticate";
import { authorize } from "~/middlewares/authorize";
import { validate } from "~/middlewares/validate";
import {
  DashboardFilterSchema,
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
  dashboardHandler.getMonthlyTrends,
);

export { router as dashboardRoutes };
