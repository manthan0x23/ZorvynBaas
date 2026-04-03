import { sessionRepo } from "../repos/session.repo";
import { userRepo } from "../repos/user.repo";
import { UnauthorizedError, NotFoundError } from "../lib/errors";
import { UserRole } from "../lib/permissions";

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type SessionUser = {
  id: string;
  username: string;
  role: UserRole;
};

export const sessionService = {
  async create(userId: string): Promise<string> {
    const user = await userRepo.findById(userId);
    if (!user) throw new NotFoundError("User");

    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    const session = await sessionRepo.create({ userId, expiresAt });

    return session.id;
  },

  async validate(sessionId: string): Promise<SessionUser> {
    const session = await sessionRepo.findById(sessionId);

    if (!session) throw new UnauthorizedError("Session not found");
    if (session.expiresAt < new Date()) {
      await sessionRepo.delete(sessionId);
      throw new UnauthorizedError("Session expired");
    }

    const user = await userRepo.findById(session.userId);
    if (!user) throw new UnauthorizedError("User no longer exists");

    return {
      id: user.id,
      username: user.username,
      role: user.role as UserRole,
    };
  },

  async revoke(sessionId: string): Promise<void> {
    const session = await sessionRepo.findById(sessionId);
    if (!session) throw new UnauthorizedError("Session not found");

    await sessionRepo.delete(sessionId);
  },

  async revokeAll(userId: string): Promise<void> {
    // useful for: password change, role change, forced logout
    await sessionRepo.deleteAllForUser(userId);
  },

  async refresh(sessionId: string): Promise<Date> {
    // extend TTL on activity — call this in authenticate middleware if needed
    const session = await sessionRepo.findById(sessionId);

    if (!session) throw new UnauthorizedError("Session not found");
    if (session.expiresAt < new Date()) {
      await sessionRepo.delete(sessionId);
      throw new UnauthorizedError("Session expired");
    }

    const newExpiresAt = new Date(Date.now() + SESSION_TTL_MS);
    await sessionRepo.updateExpiry(sessionId, newExpiresAt);

    return newExpiresAt;
  },
};
