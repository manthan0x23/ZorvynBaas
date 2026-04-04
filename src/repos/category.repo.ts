import { db } from "~/lib/db";
import { categories } from "~/db/schema/records";
import { and, eq } from "drizzle-orm";
import { logger } from "~/lib/logger";
import { RequestContext } from "~/types";

export type CreateCategoryInput = {
  name: string;
  type: "income" | "expense" | "special";
  isSystem?: boolean;
};

export const categoryRepo = {
  async findById(ctx: RequestContext, id: string) {
    const start = Date.now();

    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);

    logger.info(ctx,`[${ctx.id}] category.findById.repo`, {
      categoryId: id,
      found: !!category,
      durationMs: Date.now() - start,
    });

    return category ?? null;
  },

  async findByName(
    ctx: RequestContext,
    name: string,
    type?: CreateCategoryInput["type"],
  ) {
    const start = Date.now();

    const where = type
      ? and(eq(categories.name, name), eq(categories.type, type))
      : eq(categories.name, name);

    const [category] = await db.select().from(categories).where(where).limit(1);

    logger.info(ctx,`[${ctx.id}] category.findByName.repo`, {
      name,
      type,
      found: !!category,
      durationMs: Date.now() - start,
    });

    return category ?? null;
  },

  async create(ctx: RequestContext, input: CreateCategoryInput) {
    const start = Date.now();

    const [category] = await db
      .insert(categories)
      .values({
        ...input,
        type: input.type,
        isSystem: input.isSystem ?? false,
      })
      .returning();

    logger.info(ctx,`[${ctx.id}] category.create.repo`, {
      categoryId: category.id,
      type: input.type,
      durationMs: Date.now() - start,
    });

    return category;
  },

  async ensure(
    ctx: RequestContext,
    name: string,
    type?: CreateCategoryInput["type"],
  ) {
    const start = Date.now();

    const existing = await this.findByName(ctx, name, type);

    if (existing) {
      logger.info(ctx,`[${ctx.id}] category.ensure.repo`, {
        name,
        type,
        reused: true,
        durationMs: Date.now() - start,
      });

      return existing;
    }

    const created = await this.create(ctx, {
      name,
      type: type ?? "special",
    });

    logger.info(ctx,`[${ctx.id}] category.ensure.repo`, {
      name,
      type,
      reused: false,
      durationMs: Date.now() - start,
    });

    return created;
  },

  async list(ctx: RequestContext) {
    const start = Date.now();

    const result = await db.query.categories.findMany();

    logger.info(ctx,`[${ctx.id}] category.list.repo`, {
      count: result.length,
      durationMs: Date.now() - start,
    });

    return result;
  },
};
