import { userRepo } from "~/repos/user.repo";
import { sessionRepo } from "~/repos/session.repo";
import { ConflictError, NotFoundError, UnauthorizedError } from "~/lib/errors";
import { UserRole } from "~/lib/permissions";
import { Hash } from "~/lib/hash";

export const userService = {
  async register(username: string, password: string): Promise<string> {
    const exists = await userRepo.existsByUsername(username);
    if (exists) throw new ConflictError("Username already taken");

    const hashedPassword = await Hash.make(password);
    const user = await userRepo.create({ username, hashedPassword });

    return user.id;
  },

  async login(
    username: string,
    password: string,
  ): Promise<{ userId: string; verified: boolean }> {
    const user = await userRepo.findByUsername(username);

    console.log(user);

    const hashToCheck =
      user?.hashedPassword ?? "452b$10$invalidhashfortimingpurposes$goodHash";

    const verified = await Hash.verify(password, hashToCheck);

    if (!user || !verified) throw new UnauthorizedError("Invalid credentials");

    return { userId: user.id, verified };
  },

  async getById(id: string) {
    const user = await userRepo.findById(id);
    if (!user) throw new NotFoundError("User");

    const { hashedPassword: _, ...safeUser } = user;
    return safeUser;
  },

  async getAll(filters?: { role?: UserRole; search?: string }) {
    const users = await userRepo.findAll(filters);

    return users.map(({ hashedPassword: _, ...u }) => u);
  },

  async updateRole(targetId: string, newRole: UserRole): Promise<void> {
    const user = await userRepo.findById(targetId);
    if (!user) throw new NotFoundError("User");

    await userRepo.update(targetId, { role: newRole });

    await sessionRepo.deleteAllForUser(targetId);
  },

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await userRepo.findById(userId);
    if (!user) throw new NotFoundError("User");

    const valid = await Hash.verify(currentPassword, user.hashedPassword);
    if (!valid) throw new UnauthorizedError("Current password is incorrect");

    const hashedPassword = await Hash.make(newPassword);
    await userRepo.update(userId, { hashedPassword });

    await sessionRepo.deleteAllForUser(userId);
  },

  async delete(userId: string): Promise<void> {
    const user = await userRepo.findById(userId);
    if (!user) throw new NotFoundError("User");

    await sessionRepo.deleteAllForUser(userId);
    await userRepo.delete(userId);
  },
};
