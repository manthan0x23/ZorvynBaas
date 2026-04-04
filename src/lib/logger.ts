import fs from "fs";
import path from "path";
import { RequestContext } from "~/types";

/**
 * Simple structured logger with file rotation.
 *
 * - Colored console logs for readability
 * - JSON logs written to files
 * - Size-based rotation with limited backups
 * - Logs organized by date folders
 */

export type LogLevel = "info" | "warn" | "error" | "debug";

const LOG_ROOT = path.resolve(process.cwd(), "logs");
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_ROTATED_FILES = 5;

// 🎨 Colors
const COLORS = {
  info: "\x1b[32m", // green
  warn: "\x1b[33m", // yellow
  error: "\x1b[31m", // red
  debug: "\x1b[36m", // cyan
  reset: "\x1b[0m",
};

function todayFolder(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getDailyDir(): string {
  const dir = path.join(LOG_ROOT, todayFolder());
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function rotate(dir: string, base: string) {
  const oldest = path.join(dir, `${base}.${MAX_ROTATED_FILES}.log`);
  if (fs.existsSync(oldest)) fs.unlinkSync(oldest);

  for (let i = MAX_ROTATED_FILES - 1; i >= 1; i--) {
    const src = path.join(dir, `${base}.${i}.log`);
    const dst = path.join(dir, `${base}.${i + 1}.log`);
    if (fs.existsSync(src)) fs.renameSync(src, dst);
  }

  const active = path.join(dir, `${base}.log`);
  if (fs.existsSync(active)) {
    fs.renameSync(active, path.join(dir, `${base}.1.log`));
  }
}

function writeToFile(base: string, line: string) {
  try {
    const dir = getDailyDir();
    const filePath = path.join(dir, `${base}.log`);

    const size = fs.existsSync(filePath) ? fs.statSync(filePath).size : 0;
    if (size + Buffer.byteLength(line) > MAX_FILE_SIZE_BYTES) {
      rotate(dir, base);
    }

    fs.appendFileSync(filePath, line, { encoding: "utf8" });
  } catch (err) {
    process.stderr.write(`[logger] Failed to write log: ${err}\n`);
  }
}

export function log(
  ctx: RequestContext,
  level: LogLevel,
  message: string,
  meta: Record<string, unknown> = {},
) {
  const timestamp = new Date().toISOString();

  const jsonLine =
    JSON.stringify({
      request_id: ctx.id,
      timestamp,
      level,
      message,
      ...meta,
    }) + "\n";

  const color = COLORS[level];
  const prettyLine = `${color}[${level.toUpperCase()}] ${timestamp} - ${message} ${
    Object.keys(meta).length ? JSON.stringify(meta) : ""
  }${COLORS.reset}`;

  if (level === "error") process.stderr.write(prettyLine + "\n");
  else process.stdout.write(prettyLine + "\n");

  writeToFile("app", jsonLine);
  if (level === "error") writeToFile("error", jsonLine);
}

export const logger = {
  info: (ctx: RequestContext, msg: string, meta?: Record<string, unknown>) =>
    log(ctx, "info", msg, meta),
  warn: (ctx: RequestContext, msg: string, meta?: Record<string, unknown>) =>
    log(ctx, "warn", msg, meta),
  error: (ctx: RequestContext, msg: string, meta?: Record<string, unknown>) =>
    log(ctx, "error", msg, meta),
  debug: (ctx: RequestContext, msg: string, meta?: Record<string, unknown>) =>
    log(ctx, "debug", msg, meta),
};
