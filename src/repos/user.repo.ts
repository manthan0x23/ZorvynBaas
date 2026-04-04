import { db } from "~/lib/db";
import { users } from "~/db/schema/users";
import { and, eq, ilike, isNull } from "drizzle-orm";
import { UserRole } from "~/lib/permissions";
import { logger } from "~/lib/logger";
import { RequestContext } from "~/types";

type CreateUserInput = {
  username: string;
  hashedPassword: string;
  role?: UserRole;
};

type UpdateUserInput = Partial<{
  username: string;
  hashedPassword: string;
  role: UserRole;
}>;

export const userRepo = {
  async create(ctx: RequestContext, input: CreateUserInput) {
    logger.info(ctx,`[${ctx.id}] user.create.repo `);

    const [user] = await db.insert(users).values(input).returning();

    return user;
  },

  async findById(ctx: RequestContext, id: string) {
    logger.info(ctx,`[${ctx.id}] user.findById.repo`);

    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .limit(1);

    return user ?? null;
  },

  async findByUsername(ctx: RequestContext, username: string) {
    logger.info(ctx,`[${ctx.id}] user.findByUsername.repo`);

    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.username, username), isNull(users.deletedAt)))
      .limit(1);

    return user ?? null;
  },

  async findAll(
    ctx: RequestContext,
    filters?: { role?: UserRole; search?: string },
  ) {
    logger.info(ctx,`[${ctx.id}] user.findAll.repo`);

    const conditions = [isNull(users.deletedAt)];

    if (filters?.role) {
      conditions.push(eq(users.role, filters.role));
    }

    if (filters?.search) {
      conditions.push(ilike(users.username, `%${filters.search}%`));
    }

    const result = await db
      .select()
      .from(users)
      .where(and(...conditions));

    return result;
  },

  async update(ctx: RequestContext, id: string, input: UpdateUserInput) {
    logger.info(ctx,`[${ctx.id}] user.update.repo`);

    const [updated] = await db
      .update(users)
      .set({ ...input, updatedAt: new Date() })
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .returning();

    return updated ?? null;
  },

  async delete(ctx: RequestContext, id: string) {
    logger.info(ctx,`[${ctx.id}] user.delete.repo`);

    const now = new Date();

    const [updated] = await db
      .update(users)
      .set({ deletedAt: now, updatedAt: now })
      .where(eq(users.id, id))
      .returning();

    return updated ?? null;
  },

  async existsByUsername(
    ctx: RequestContext,
    username: string,
  ): Promise<boolean> {
    logger.info(ctx,`[${ctx.id}] user.existsByUsername.repo`);

    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.username, username), isNull(users.deletedAt)))
      .limit(1);

    return !!user;
  },
};
