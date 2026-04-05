import { app } from "./app";
import { env } from "./env";

const server = app.listen(env.PORT, () => {
  console.log(`Server running on PORT ${env.PORT}`);
});

const shutdown = async (signal: string) => {
  console.log(`[SHUTDOWN] Received ${signal}`);

  server.close(async (err) => {
    if (err) {
      console.error("[SHUTDOWN] Error closing server:", err);
      process.exit(1);
    }

    console.log("[SHUTDOWN] HTTP server closed");

    try {
      console.log("[SHUTDOWN] Cleanup complete");
      process.exit(0);
    } catch (error) {
      console.error("[SHUTDOWN] Cleanup failed:", error);
      process.exit(1);
    }
  });

  setTimeout(() => {
    console.error("[SHUTDOWN] Force exiting...");
    process.exit(1);
  }, 10000);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);