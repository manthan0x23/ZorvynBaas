import { Request, Response, NextFunction } from "express";
import { AppError, ValidationError } from "./errors";
import { logger } from "~/lib/logger";
import { createContext } from "./ctx";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof ValidationError) {
    logger.error(createContext(req), `[${req.id}] validation_error`, {
      code: err.code,
      message: err.message,
      fields: err.fields,
    });

    return res.status(422).json({
      ok: false,
      code: err.code,
      message: err.message,
      fields: err.fields,
    });
  }

  if (err instanceof AppError) {
    logger.error(createContext(req), `[${req.id}] app_error`, {
      code: err.code,
      message: err.message,
      statusCode: err.statusCode,
    });

    return res.status(err.statusCode).json({
      ok: false,
      code: err.code,
      message: err.message,
    });
  }

  logger.error(
    createContext(req),
    `[${req.id}] unhandled_error`,
    err instanceof Error
      ? { message: err.message, stack: err.stack }
      : { error: err },
  );

  return res.status(500).json({
    ok: false,
    code: "INTERNAL_ERROR",
    message: "Something went wrong",
  });
}
