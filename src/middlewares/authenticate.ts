import { Request, Response, NextFunction } from "express";
import { createContext } from "~/lib/ctx";
import { UnauthorizedError } from "~/lib/errors";
import { sessionService } from "~/services/session.service";
import { logger } from "~/lib/logger";

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    const ctx = createContext(req);

    logger.info(ctx, `[${req.id}] auth.authenticate.start`);

    const sessionId = req.cookies?.session_id;
    if (!sessionId) {
      throw new UnauthorizedError("No session");
    }

    const user = await sessionService.validate(createContext(req), sessionId);

    if (!user) {
      throw new UnauthorizedError("Session expired");
    }

    req.user = user;

    logger.info(ctx, `[${req.id}] auth.authenticate.success`);

    next();
  } catch (e) {
    next(e);
  }
}
