import { sessionRepo } from "~/repos/session.repo";
import { userRepo } from "~/repos/user.repo";
import { UnauthorizedError, NotFoundError } from "~/lib/errors";
import { UserRole } from "~/lib/permissions";
import { RequestContext } from "~/types";
import { logger } from "~/lib/logger";

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type SessionUser = {
  id: string;
  username: string;
  role: UserRole;
};

export const sessionService = {
  async create(ctx: RequestContext, userId: string): Promise<string> {
    logger.info(ctx,`[${ctx.id}] session.create.service`);

    const user = await userRepo.findById(ctx, userId);
    if (!user) throw new NotFoundError("User");

    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    const session = await sessionRepo.create(ctx, { userId, expiresAt });

    return session.id;
  },

  async validate(ctx: RequestContext, sessionId: string): Promise<SessionUser> {
    logger.info(ctx,`[${ctx.id}] session.validate.service`);

    const session = await sessionRepo.findById(ctx, sessionId);

    if (!session) throw new UnauthorizedError("Session not found");
    if (session.expiresAt < new Date()) {
      await sessionRepo.delete(ctx, sessionId);
      throw new UnauthorizedError("Session expired");
    }

    const user = await userRepo.findById(ctx, session.userId);
    if (!user) throw new UnauthorizedError("User no longer exists");

    return {
      id: user.id,
      username: user.username,
      role: user.role as UserRole,
    };
  },

  async revoke(ctx: RequestContext, sessionId: string): Promise<void> {
    logger.info(ctx,`[${ctx.id}] session.revoke.service`);

    const session = await sessionRepo.findById(ctx, sessionId);
    if (!session) throw new UnauthorizedError("Session not found");

    await sessionRepo.delete(ctx, sessionId);
  },

  async revokeAll(ctx: RequestContext, userId: string): Promise<void> {
    logger.info(ctx,`[${ctx.id}] session.revokeAll.service`);

    await sessionRepo.deleteAllForUser(ctx, userId);
  },

  async refresh(ctx: RequestContext, sessionId: string): Promise<Date> {
    logger.info(ctx,`[${ctx.id}] session.refresh.service`);

    const session = await sessionRepo.findById(ctx, sessionId);

    if (!session) throw new UnauthorizedError("Session not found");
    if (session.expiresAt < new Date()) {
      await sessionRepo.delete(ctx, sessionId);
      throw new UnauthorizedError("Session expired");
    }

    const newExpiresAt = new Date(Date.now() + SESSION_TTL_MS);
    await sessionRepo.updateExpiry(ctx, sessionId, newExpiresAt);

    return newExpiresAt;
  },
};
