import rateLimit, {
  ipKeyGenerator,
  RateLimitRequestHandler,
} from "express-rate-limit";

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
  max: 2,
  code: "TOO_MANY_LOGIN_ATTEMPTS",
  message: "Too many login attempts, try later",
  keyGenerator: (req) => `${req.ip}-${req.body.username ?? ""}`,
});
