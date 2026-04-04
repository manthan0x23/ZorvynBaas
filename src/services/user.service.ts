import { userRepo } from "~/repos/user.repo";
import { sessionRepo } from "~/repos/session.repo";
import { ConflictError, NotFoundError, UnauthorizedError } from "~/lib/errors";
import { UserRole } from "~/lib/permissions";
import { Hash } from "~/lib/hash";
import { RequestContext } from "~/types";
import { logger } from "~/lib/logger";

export const userService = {
  async register(
    ctx: RequestContext,
    username: string,
    password: string,
  ): Promise<string> {
    logger.info(ctx, `[${ctx.id}] user.register.service`);

    const exists = await userRepo.existsByUsername(ctx, username);
    if (exists) throw new ConflictError("Username already taken");

    const hashedPassword = await Hash.make(password);
    const user = await userRepo.create(ctx, { username, hashedPassword });

    return user.id;
  },

  async login(
    ctx: RequestContext,
    username: string,
    password: string,
  ): Promise<{ userId: string; verified: boolean }> {
    logger.info(ctx, `[${ctx.id}] user.login.service`);

    const user = await userRepo.findByUsername(ctx, username);

    if (!user) throw new NotFoundError("User not found");

    const hashToCheck = user.hashedPassword;

    const verified = await Hash.verify(password, hashToCheck);

    if (!verified) throw new UnauthorizedError("Invalid credentials");

    return { userId: user.id, verified };
  },

  async getById(ctx: RequestContext, id: string) {
    logger.info(ctx, `[${ctx.id}] user.getById.service`);

    const user = await userRepo.findById(ctx, id);
    if (!user) throw new NotFoundError("User");

    const { hashedPassword: _, ...safeUser } = user;
    return safeUser;
  },

  async getAll(
    ctx: RequestContext,
    filters?: { role?: UserRole; search?: string },
  ) {
    logger.info(ctx, `[${ctx.id}] user.getAll.service`);

    const users = await userRepo.findAll(ctx, filters);

    return users.map(({ hashedPassword: _, ...u }) => u);
  },

  async updateRole(
    ctx: RequestContext,
    targetId: string,
    newRole: UserRole,
  ): Promise<void> {
    logger.info(ctx, `[${ctx.id}] user.updateRole.service`);

    const user = await userRepo.findById(ctx, targetId);
    if (!user) throw new NotFoundError("User");

    await userRepo.update(ctx, targetId, { role: newRole });

    await sessionRepo.deleteAllForUser(ctx, targetId);
  },

  async changePassword(
    ctx: RequestContext,
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    logger.info(ctx, `[${ctx.id}] user.changePassword.service`);

    const user = await userRepo.findById(ctx, userId);
    if (!user) throw new NotFoundError("User");

    const valid = await Hash.verify(currentPassword, user.hashedPassword);
    if (!valid) throw new UnauthorizedError("Current password is incorrect");

    const hashedPassword = await Hash.make(newPassword);
    await userRepo.update(ctx, userId, { hashedPassword });

    await sessionRepo.deleteAllForUser(ctx, userId);
  },

  async delete(ctx: RequestContext, userId: string): Promise<void> {
    logger.info(ctx, `[${ctx.id}] user.delete.service`);

    const user = await userRepo.findById(ctx, userId);
    if (!user) throw new NotFoundError("User");

    await sessionRepo.deleteAllForUser(ctx, userId);
    await userRepo.delete(ctx, userId);
  },
};
