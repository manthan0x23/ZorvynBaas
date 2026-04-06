import { CookieOptions, Request, Response } from "express";
import { asyncHandler } from "../lib/handler";
import { userService } from "../services/user.service";
import { sessionService } from "../services/session.service";
import { logger } from "~/lib/logger";
import { createContext } from "~/lib/ctx";
import { env } from "~/env";

export const userHandler = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const ctx = createContext(req);

    logger.info(ctx, `[${req.id}] user.register.handler`);
    const { username, password } = req.validated.body;

    const userId = await userService.register(ctx, username, password);
    const sessionId = await sessionService.create(ctx, userId);

    res.cookie("session_id", sessionId, cookieOptions());

    res.status(201).json({ ok: true, data: { userId } });
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const ctx = createContext(req);

    logger.info(ctx, `[${req.id}] user.login.handler`);
    const { username, password } = req.validated.body;

    const { userId } = await userService.login(ctx, username, password);
    const sessionId = await sessionService.create(ctx, userId);

    res.cookie("session_id", sessionId, cookieOptions());

    const user = await userService.getById(ctx, userId);

    res.json({ ok: true, data: user });
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    const ctx = createContext(req);

    logger.info(ctx, `[${req.id}] user.logout.handler`);
    const sessionId = req.cookies?.session_id;

    if (sessionId) await sessionService.revoke(ctx, sessionId);

    res.clearCookie("session_id");

    res.json({ ok: true });
  }),

  logoutAll: asyncHandler(async (req: Request, res: Response) => {
    const ctx = createContext(req);

    logger.info(ctx, `[${req.id}] user.logoutAll.handler`);

    await sessionService.revokeAll(ctx, req.user.id);
    res.clearCookie("session_id");

    res.json({ ok: true });
  }),

  getMe: asyncHandler(async (req: Request, res: Response) => {
    const ctx = createContext(req);

    logger.info(ctx, `[${req.id}] user.getMe.handler`);

    const user = await userService.getById(ctx, req.user.id);

    res.json({ ok: true, data: user });
  }),

  getAll: asyncHandler(async (req: Request, res: Response) => {
    const ctx = createContext(req);

    logger.info(ctx, `[${req.id}] user.getAll.handler`);

    const users = await userService.getAll(ctx, req.validated.query);

    res.json({ ok: true, data: users });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const ctx = createContext(req);

    logger.info(ctx, `[${req.id}] user.getById.handler`);
    const id = req.validated.params.id as string;

    const user = await userService.getById(ctx, id);

    res.json({ ok: true, data: user });
  }),

  updateRole: asyncHandler(async (req: Request, res: Response) => {
    const ctx = createContext(req);

    logger.info(ctx, `[${req.id}] user.updateRole.handler`);
    const id = req.validated.params.id as string;

    await userService.updateRole(ctx, id, req.validated.body.role);

    res.json({ ok: true });
  }),

  changePassword: asyncHandler(async (req: Request, res: Response) => {
    const ctx = createContext(req);

    logger.info(ctx, `[${req.id}] user.changePassword.handler`);

    const { currentPassword, newPassword } = req.validated.body;

    await userService.changePassword(
      ctx,
      req.user.id,
      currentPassword,
      newPassword,
    );
    await sessionService.revokeAll(ctx, req.user.id);

    res.clearCookie("session_id");

    res.json({ ok: true, message: "Password changed. Please log in again." });
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const ctx = createContext(req);

    logger.info(ctx, `[${req.id}] user.delete.handler`);

    const id = req.validated.params.id as string;

    await userService.delete(ctx, id);

    res.json({ ok: true });
  }),
};

function cookieOptions(): CookieOptions {
  const isProd = env.NODE_ENV === "production";

  console.log(isProd, "isProd cookies");

  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}
