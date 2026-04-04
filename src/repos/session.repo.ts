// src/repos/session.repo.ts
import { db } from "~/lib/db";
import { sessions } from "~/db/schema/users";
import { eq } from "drizzle-orm";

type CreateSessionInput = {
  userId: string;
  expiresAt: Date;
};

export const sessionRepo = {
  async create(input: CreateSessionInput) {
    const [session] = await db.insert(sessions).values(input).returning();

    return session;
  },

  async findById(id: string) {
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, id))
      .limit(1);

    return session ?? null;
  },

  async delete(id: string) {
    await db.delete(sessions).where(eq(sessions.id, id));
  },

  async deleteAllForUser(userId: string) {
    await db.delete(sessions).where(eq(sessions.userId, userId));
  },

  async updateExpiry(id: string, expiresAt: Date) {
    await db
      .update(sessions)
      .set({ expiresAt, updatedAt: new Date() })
      .where(eq(sessions.id, id));
  },
};
