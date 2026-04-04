import { db } from "~/lib/db";
import { categories } from "~/db/schema/records";
import { and, eq } from "drizzle-orm";

export type CreateCategoryInput = {
  name: string;
  type: "income" | "expense" | "special";
  isSystem?: boolean;
};

export const categoryRepo = {
  async findById(id: string) {
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);

    return category ?? null;
  },

  async findByName(name: string, type?: CreateCategoryInput["type"]) {
    const where = type
      ? and(eq(categories.name, name), eq(categories.type, type))
      : eq(categories.name, name);

    const [category] = await db.select().from(categories).where(where).limit(1);

    return category ?? null;
  },

  async create(input: CreateCategoryInput) {
    const [category] = await db
      .insert(categories)
      .values({
        ...input,
        type: input.type,
        isSystem: input.isSystem ?? false,
      })
      .returning();

    return category;
  },

  async ensure(name: string, type?: CreateCategoryInput["type"]) {
    const existing = await this.findByName(name, type);

    if (existing) return existing;

    return this.create({
      name,
      type: type ?? "special",
    });
  },

  async list() {
    return await db.query.categories.findMany();
  },
};
