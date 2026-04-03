import { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "../lib/errors";
import { sessionService } from "~/services/session.service";

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    const sessionId = req.cookies?.session_id;
    if (!sessionId) throw new UnauthorizedError("No session");

    const user = await sessionService.validate(sessionId);
    if (!user) throw new UnauthorizedError("Session expired");

    req.user = user;
    next();
  } catch (e) {
    next(e);
  }
}
