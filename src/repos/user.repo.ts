// src/repos/user.repo.ts
import { db } from "~/lib/db";
import { users } from "~/db/schema/users";
import { and, eq, ilike, isNull } from "drizzle-orm";
import { UserRole } from "~/lib/permissions";

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
  async create(input: CreateUserInput) {
    const [user] = await db.insert(users).values(input).returning();

    return user;
  },

  async findById(id: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .limit(1);

    return user ?? null;
  },

  async findByUsername(username: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.username, username), isNull(users.deletedAt)))
      .limit(1);

    return user ?? null;
  },

  async findAll(filters?: { role?: UserRole; search?: string }) {
    const conditions = [isNull(users.deletedAt)];

    if (filters?.role) {
      conditions.push(eq(users.role, filters.role));
    }

    if (filters?.search) {
      conditions.push(ilike(users.username, `%${filters.search}%`));
    }

    return db
      .select()
      .from(users)
      .where(and(...conditions));
  },

  async update(id: string, input: UpdateUserInput) {
    const [updated] = await db
      .update(users)
      .set({ ...input, updatedAt: new Date() })
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .returning();

    return updated ?? null;
  },

  async delete(id: string) {
    const now = new Date();

    const [updated] = await db
      .update(users)
      .set({ deletedAt: now, updatedAt: now })
      .where(eq(users.id, id))
      .returning();

    return updated ?? null;
  },

  async existsByUsername(username: string): Promise<boolean> {
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.username, username), isNull(users.deletedAt)))
      .limit(1);

    return !!user;
  },
};
