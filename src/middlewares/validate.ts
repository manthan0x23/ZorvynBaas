import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { createContext } from "~/lib/ctx";
import { ValidationError } from "~/lib/errors";
import { logger } from "~/lib/logger";

type Source = "body" | "query" | "params";

export function validate<T>(schema: ZodSchema<T>, source: Source = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    logger.info(createContext(req), `[${req.id}] validate.${source}.start`);

    const data = req[source];
    const result = schema.safeParse(data);

    if (!result.success) {
      const fields: Record<string, string[]> = {};

      for (const issue of result.error.issues) {
        const path = issue.path.join(".") || "_root";
        if (!fields[path]) fields[path] = [];
        fields[path].push(issue.message);
      }

      return next(new ValidationError(fields));
    }

    req.validated ??= {};
    req.validated[source] = result.data;

    logger.info(createContext(req), `[${req.id}] validate.${source}.success`);

    next();
  };
}
