import { UserRole } from "~/lib/permissions";

declare global {
  namespace Express {
    interface Request {
      user: { id: string; username: string; role: UserRole };
    }
  }
}
