import { db } from "~/lib/db";
import { sessions } from "~/db/schema/users";
import { eq } from "drizzle-orm";
import { logger } from "~/lib/logger";
import { RequestContext } from "~/types";

type CreateSessionInput = {
  userId: string;
  expiresAt: Date;
};

export const sessionRepo = {
  async create(ctx: RequestContext, input: CreateSessionInput) {
    logger.info(ctx,`[${ctx.id}] sessionRepo.sumByCategory (repo)`);

    const [session] = await db.insert(sessions).values(input).returning();

    return session;
  },

  async findById(ctx: RequestContext, id: string) {
    logger.info(ctx,`[${ctx.id}] sessionRepo.findById (repo)`);

    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, id))
      .limit(1);

    return session ?? null;
  },

  async delete(ctx: RequestContext, id: string) {
    logger.info(ctx,`[${ctx.id}] sessionRepo.delete (repo)`);

    await db.delete(sessions).where(eq(sessions.id, id));
  },

  async deleteAllForUser(ctx: RequestContext, userId: string) {
    logger.info(ctx,`[${ctx.id}] sessionRepo.deleteAllForUser (repo)`);

    await db.delete(sessions).where(eq(sessions.userId, userId));
  },

  async updateExpiry(ctx: RequestContext, id: string, expiresAt: Date) {
    logger.info(ctx,`[${ctx.id}] sessionRepo.updateExpiry (repo)`);

    await db
      .update(sessions)
      .set({ expiresAt, updatedAt: new Date() })
      .where(eq(sessions.id, id));
  },
};
