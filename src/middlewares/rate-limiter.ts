import rateLimit, {
  ipKeyGenerator,
  RateLimitRequestHandler,
} from "express-rate-limit";
import { createContext } from "~/lib/ctx";
import { logger } from "~/lib/logger";

type LimiterOptions = {
  windowMs?: number;
  max: number;
  code: string;
  message: string;
  keyGenerator?: (req: any) => string;
};

export function createLimiter({
  windowMs = 15 * 60 * 1000,
  max,
  code,
  message,
  keyGenerator,
}: LimiterOptions): RateLimitRequestHandler {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: keyGenerator
      ? (req) => keyGenerator(req)
      : (req) => ipKeyGenerator(req.ip!),

    handler: (req, res, _next, options) => {
      logger.warn(createContext(req), `[${req.id}] rate_limit.exceeded`, {
        code,
        max,
        windowMs,
        key: options.keyGenerator?.(req, res),
        ip: req.ip,
        path: req.originalUrl,
        method: req.method,
      });

      res.status(options.statusCode).json({
        ok: false,
        code,
        message,
      });
    },

    message: {
      ok: false,
      code,
      message,
    },
  });
}

export const globalLimiter = createLimiter({
  max: 150,
  code: "RATE_LIMITED",
  message: "Too many requests, try later",
});

export const authLimiter = createLimiter({
  max: 15,
  code: "AUTH_RATE_LIMITED",
  message: "Too many auth attempts, try later",
});

export const loginLimiter = createLimiter({
  windowMs: 10 * 60 * 1000,
  max: 5,
  code: "TOO_MANY_LOGIN_ATTEMPTS",
  message: "Too many login attempts, try later",
  keyGenerator: (req) => `${req.ip}-${req.body.username ?? ""}`,
});
