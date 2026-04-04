import { UserRole } from "~/lib/permissions";

declare global {
  namespace Express {
    interface Request {
      id: string;
      startTime: number;
      user: { id: string; username: string; role: UserRole };
      validated: {
        body?: any;
        query?: any;
        params?: any;
      };
    }
  }
}

export type RequestContext = {
  id: string;
  startTime: number;
  user: { id: string; username: string; role: UserRole };
};
