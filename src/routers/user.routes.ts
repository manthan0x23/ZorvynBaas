import { Router } from "express";
import { userHandler } from "~/handlers/user.handler";
import { authorize } from "~/middlewares/authorize";
import { validate } from "~/middlewares/validate";
import { authenticate } from "~/middlewares/authenticate";
import {
  ChangePasswordSchema,
  UpdateRoleSchema,
  UserFilterSchema,
  UserIdSchema,
} from "~/validators/user.validator";

const router = Router();

router.use(authenticate);

router.get("/me", userHandler.getMe);

router.patch(
  "/me/password",
  validate(ChangePasswordSchema, "body"),
  userHandler.changePassword,
);

router.get(
  "/",
  authorize("user:read"),
  validate(UserFilterSchema, "query"),
  userHandler.getAll,
);

router.get(
  "/:id",
  authorize("user:read"),
  validate(UserIdSchema, "params"),
  userHandler.getById,
);

router.patch(
  "/:id/role",
  authorize("user:update"),
  validate(UserIdSchema, "params"),
  validate(UpdateRoleSchema, "body"),
  userHandler.updateRole,
);

router.delete(
  "/:id",
  authorize("user:delete"),
  validate(UserIdSchema, "params"),
  userHandler.delete,
);

export { router as userRoutes };
