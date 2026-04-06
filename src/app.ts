import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { errorHandler } from "./lib/error-handler";
import morgan from "morgan";
import { authRoutes } from "./routers/auth.routes";
import { userRoutes } from "./routers/user.routes";
import { recordRoutes } from "./routers/record.routes";
import { dashboardRoutes } from "./routers/dashboard.routes";
import { globalLimiter } from "./middlewares/rate-limiter";
import { requestTracer } from "./middlewares/request-tracer";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./lib/swagger-spec";
import { env } from "./env";

const app = express();

console.log([env.BASE_URL, `http://localhost:${env.PORT}`]);

app.use(requestTracer);
app.set("trust proxy", 1);

app
  .use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          connectSrc: ["'self'", env.BASE_URL],
        },
      },
    }),
  )
  .use(
    cors({
      origin: [
        env.BASE_URL,
        `http://localhost:${env.PORT}`,
        "https://www.zorvyn-baas.publicvm.com",
      ],
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  )
  .use(morgan("combined"));

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { ok: false, code: "RATE_LIMITED", message: "Too many requests" },
  }),
);

app
  .use(express.json({ limit: "50kb" }))
  .use(express.urlencoded({ extended: true, limit: "50kb" }))
  .use(cookieParser())
  .use(compression());

app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    swaggerOptions: {
      withCredentials: true,
    },
  }),
);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

app.use("/api/auth", authRoutes);
app.use(globalLimiter);
app.use("/api/users", userRoutes);
app.use("/api/records", recordRoutes);
app.use("/api/dashboard", dashboardRoutes);

app
  .use((_req, res) => {
    res
      .status(404)
      .json({ ok: false, code: "NOT_FOUND", message: "Route not found" });
  })
  .use(errorHandler);

export { app };
