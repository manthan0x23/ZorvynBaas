import { Router } from "express";
import { recordHandler } from "~/handlers/record.handler";
import { authenticate } from "~/middlewares/authenticate";
import { authorize } from "~/middlewares/authorize";
import { validate } from "~/middlewares/validate";

import {
  CreateRecordSchema,
  RecordFilterSchema,
  RecordIdSchema,
  UpdateRecordSchema,
} from "~/validators/record.validator";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  authorize("record:read"),
  validate(RecordFilterSchema, "query"),
  recordHandler.getAll,
);

router.get(
  "/:id",
  authorize("record:read"),
  validate(RecordIdSchema, "params"),
  recordHandler.getById,
);

router.post(
  "/",
  authorize("record:create"),
  validate(CreateRecordSchema, "body"),
  recordHandler.create,
);

router.patch(
  "/:id",
  authorize("record:update"),
  validate(RecordIdSchema, "params"),
  validate(UpdateRecordSchema, "body"),
  recordHandler.update,
);

router.delete(
  "/:id",
  authorize("record:delete"),
  validate(RecordIdSchema, "params"),
  recordHandler.delete,
);

export { router as recordRoutes };
