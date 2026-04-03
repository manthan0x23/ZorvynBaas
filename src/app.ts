import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { errorHandler } from "./lib/errorHandler";
import { env } from "./env";
import morgan from "morgan";
import { authRoutes } from "./routers/auth.routes";
import { userRoutes } from "./routers/user.routes";
import { recordRoutes } from "./routers/record.routes";
import { dashboardRoutes } from "./routers/dashboard.routes";

const app = express();

app
  .use(helmet())
  .use(
    cors({
      origin: "*",
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  )
  .use(morgan("dev"));

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

app.get("/health", (_req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

app.use("/api/auth", authRoutes);
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

app.listen(env.PORT, () => {
  console.log(`Server running on PORT ${env.PORT}`);
});

export { app };
