import { NextFunction, Request, Response } from "express";
import { hasPermission, Permission } from "~/lib/permissions";
import { ForbiddenError } from "~/lib/errors";
import { logger } from "~/lib/logger";
import { createContext } from "~/lib/ctx";

export function authorize(permission: Permission) {
  return (req: Request, _res: Response, next: NextFunction) => {
    logger.info(createContext(req), `[${req.id}] auth.authorize`, {
      permission,
      role: req.user?.role,
    });

    if (!hasPermission(req.user.role, permission)) {
      throw new ForbiddenError(permission);
    }

    next();
  };
}
