import { Request, Response } from "express";
import { asyncHandler } from "../lib/handler";
import { userService } from "../services/user.service";
import { sessionService } from "../services/session.service";

export const userHandler = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const { username, password } = req.body;

    console.log(username, password);

    const userId = await userService.register(username, password);

    const sessionId = await sessionService.create(userId);
    res.cookie("session_id", sessionId, cookieOptions());

    res.status(201).json({ ok: true, data: { userId } });
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const { username, password } = req.body;
    const { userId } = await userService.login(username, password);

    const sessionId = await sessionService.create(userId);
    res.cookie("session_id", sessionId, cookieOptions());

    const user = await userService.getById(userId);
    res.json({ ok: true, data: user });
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    const sessionId = req.cookies?.session_id;
    if (sessionId) await sessionService.revoke(sessionId);

    res.clearCookie("session_id");
    res.json({ ok: true });
  }),

  logoutAll: asyncHandler(async (req: Request, res: Response) => {
    await sessionService.revokeAll(req.user.id);
    res.clearCookie("session_id");
    res.json({ ok: true });
  }),

  getMe: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.getById(req.user.id);
    res.json({ ok: true, data: user });
  }),

  getAll: asyncHandler(async (req: Request, res: Response) => {
    const users = await userService.getAll(req.query);
    res.json({ ok: true, data: users });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;

    const user = await userService.getById(id);
    res.json({ ok: true, data: user });
  }),

  updateRole: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;

    await userService.updateRole(id, req.body.role);
    res.json({ ok: true });
  }),

  changePassword: asyncHandler(async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    await userService.changePassword(req.user.id, currentPassword, newPassword);

    await sessionService.revokeAll(req.user.id);
    res.clearCookie("session_id");

    res.json({ ok: true, message: "Password changed. Please log in again." });
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;

    await userService.delete(id);
    res.json({ ok: true });
  }),
};

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}
