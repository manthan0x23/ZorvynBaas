import { Router } from "express";
import { userHandler } from "~/handlers/user.handler";
import { authenticate } from "~/middlewares/authenticate";
import { RegisterSchema, LoginSchema } from "~/validators/user.validator";
import { validate } from "~/middlewares/validate";
import { authLimiter, loginLimiter } from "~/middlewares/rate-limiter";

const router = Router();

router.use(authLimiter);

router.post(
  "/register",
  validate(RegisterSchema, "body"),
  userHandler.register,
);

router.post(
  "/login",
  loginLimiter,
  validate(LoginSchema, "body"),
  userHandler.login,
);

router.post("/logout", authenticate, userHandler.logout);
router.post("/logout-all", authenticate, userHandler.logoutAll);

export { router as authRoutes };
