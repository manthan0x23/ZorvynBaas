import { randomUUID } from "crypto";
import { NextFunction, Request, Response } from "express";
import { createContext } from "~/lib/ctx";
import * as Logger from "~/lib/logger";

export function requestTracer(req: Request, res: Response, next: NextFunction) {
  req.id = (req.headers["x-request-id"] as string) ?? randomUUID();
  req.startTime = Date.now();

  res.setHeader("x-request-id", req.id);

  Logger.logger.info(createContext(req), "request_received", {
    requestId: req.id,
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res.on("finish", () => {
    const duration = Date.now() - req.startTime;
    const level: Logger.LogLevel =
      res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";

    Logger.log(createContext(req), level, "request_completed", {
      requestId: req.id,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: duration,
    });
  });

  next();
}
